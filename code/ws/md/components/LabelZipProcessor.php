<?php

namespace backend\components;

use backend\exceptions\CarrierException;
use backend\exceptions\InvalidUploadException;
use backend\exceptions\InvalidZipException;
use backend\exceptions\TrackException;
use common\components\LabelUpdateJob;
use common\modules\v1\models\Carrier;
use common\modules\v1\models\Label;
use common\modules\v1\models\Track;
use yii\base\ErrorException;
use yii\base\Exception;
use yii\db\IntegrityException;
use yii\validators\FileValidator;

/**
 * Class LabelZipProcessor
 *
 * @package backend\components
 *
 * @todo UTF8
 *
 */
class LabelZipProcessor
{
    const _SESSION_KEY              = "labelparser_job";
    const _FILE_LANGUAGE            = "language.txt";
    const _FILE_DESCRIPTION_CARRIER = "cddescription.txt";
    const _FILE_DESCRIPTION_TRACK   = "trackdescription.txt";
    const _FILE_DESCRIPTION_INLAY   = "inlay.jpg";
    const _DEPTH_FILES              = 2;

    /**
     * @var UploadedFile
     */
    private $file;

    /**
     * @var \ZipArchive
     */
    private $zip;

    /**
     * @var LabelUpdateJob
     */
    private $job;

    /**
     * @var array
     */
    private $carriers;

    /**
     * @var array
     */
    private $tracks;

    /**
     * @param UploadedFile $file
     */
    public function __construct($file=null)
    {
        $this->file = $file;
        $this->job  = $this->readJob();
    }

    /**
     * @return bool
     * @throws InvalidUploadException
     * @throws InvalidZipException
     */
    public function validate()
    {
        if (!$this->validateFile()) {
            throw new InvalidUploadException( InvalidUploadException::MESSAGE );
        }

        if (!$this->validateContents()) {
            throw new InvalidZipException( InvalidZipException::MESSAGE_INVALID_FILE );
        }

        return true;
    }

    /**
     * @return bool
     */
    protected function validateFile()
    {
        if (!$this->file) {
            return false;
        }

        $validator            = new FileValidator();
        $validator->mimeTypes = ['application/zip'];

        // Correction for plupload files or finfo_file will throw an exception (not found)
        $this->file->tempName = \Yii::getAlias('@runtime/upload/') . $this->file->tempName;

        return $validator->validate($this->file);
    }

    /**
     * @return bool
     * @throws InvalidZipException
     */
    protected function validateContents()
    {
        $this->zip = new \ZipArchive();
        $index     = [];

        // Open the archive
        if (false === $this->zip->open($this->file->tempName)) {
            throw new InvalidZipException( InvalidZipException::MESSAGE_COULD_NOT_READ );
        }

        // Validate the language file
        if (
            false === $this->zip->locateName(self::_FILE_LANGUAGE) ||
            !preg_match('/([a-zA-Z]{2})/', $this->zip->getFromName(self::_FILE_LANGUAGE))
        ) {
            throw new InvalidZipException( InvalidZipException::MESSAGE_LANGUAGE_FILE_MISSING_OR_INVALID );
        }

        // Build an index of files
        for($i=0; $i<$this->zip->numFiles; $i++)
        {
            $name = $this->zip->getNameIndex($i);

            if ($name === self::_FILE_LANGUAGE) {
                continue;
            }

            $contents  = array_filter(explode('/', $name));
            $deepArray = [];
            $current   = false;

            foreach($contents as $k=>$dir) {
                if (false === $current) {
                    $deepArray[$dir] = [];
                    $current = &$deepArray[$dir];
                } else {
                    if ($k === self::_DEPTH_FILES) {
                        $current[] = $dir;
                    } else {
                        $current[$dir] = [];
                        $current       = &$current[$dir];
                    }
                }
            }

            $index = array_merge_recursive($index, $deepArray);

            unset($current);
        }

        // Validate the index
        foreach($index as $label=>$carriers) {

            foreach($carriers as $carrier=>$files) {

                // Validate carrier
                $carrierData = $this->parseCarrier($label . '/' . $carrier . '/' . self::_FILE_DESCRIPTION_CARRIER);

                if (!$carrierData) {
                    throw new InvalidZipException( sprintf(InvalidZipException::MESSAGE_INVALID_CARRIER, $carrier) );
                }

                if (!$this->isValidLabel($carrierData['label']['code'])) {
                    throw new InvalidZipException( sprintf(InvalidZipException::MESSAGE_INVALID_LABEL, $carrierData['label']['code']) );
                }

                // Validate inlay
                if (!$this->parseInlay($carrierData, $label . '/' . $carrier . '/' . self::_FILE_DESCRIPTION_INLAY)) {
                    throw new InvalidZipException( sprintf(InvalidZipException::MESSAGE_CARRIER_MISSING_INLAY, $carrier) );
                }

                // Validate tracks
                $carrierData['tracks'] = $this->parseTracks($label . '/' . $carrier . '/' . self::_FILE_DESCRIPTION_TRACK);

                if (!$carrierData['tracks']) {
                    throw new InvalidZipException( sprintf(InvalidZipException::MESSAGE_CARRIER_MISSING_TRACKS, $carrier) );
                }

                $this->carriers[$carrier] = $carrierData;
            }
        }

        return true;
    }

    /**
     * @todo include userID when reading job
     * @return array
     */
    protected function readJob()
    {
        $identifier = \Yii::$app->session->get(self::_SESSION_KEY);

        if (!$identifier) return false;

        try {
            $job = new LabelUpdateJob($identifier);
        } catch (Exception $e) {
            $this->forgetJob();
            return false;
        }

        return $job;
    }

    public function forgetJob()
    {
        if ($this->job) {
            $this->job->clear();
        }

        \Yii::$app->session->remove(self::_SESSION_KEY);
    }

    /**
     * @todo include userID when creating job
     * @return bool
     */
    public function startJob()
    {
        if ($this->getJob()) {
            return false;
        }

        $parameters = [];
        foreach($this->carriers as $code=>$carrier) {
            $parameters[$code] = count($carrier['tracks']);
        }

        $this->job = new LabelUpdateJob();
        if (!$this->job->start($parameters)) {
            return false;
        }

        \Yii::$app->session->set(self::_SESSION_KEY, $this->job->getId());

        return $this->job;
    }

    /**
     * @return array
     */
    public function getJob()
    {
        return $this->job;
    }

    /**
     * @param array $sites
     * @throws InvalidZipException
     * @return bool
     */
    public function save($sites)
    {
        if (empty($this->carriers)) {
            throw new InvalidZipException( InvalidZipException::MESSAGE_SAVE_ERROR );
        }

        $labels = [];

        // Insert the carriers
        foreach ($this->carriers as $carrierData)
        {
            if (
                empty($carrierData) ||
                empty($carrierData['tracks'])
            ) {
                throw new InvalidZipException(InvalidZipException::MESSAGE_SAVE_ERROR);
            }

            /**
             * @todo store tracks and attach to all applicable sites (keeping one master copy with siteID=0)
             */
            $label = Label::findOne(['code' => $carrierData['label']['code']]);

            if (!$label) {
                throw new InvalidZipException(sprintf(InvalidZipException::MESSAGE_INVALID_LABEL, $carrierData['label']['code']));
            }

            $labelMaster              = $label->findMaster();
            $labels[$labelMaster->ID] = $labelMaster->ID;

            $carrier     = Carrier::findOne(['labelID' => $labelMaster->ID, 'code' => $carrierData['code']]);

            if (!$carrier) {
                $carrier = new Carrier();
            }

            $carrier->masterID    = $labelMaster->ID;
            $carrier->labelID     = $labelMaster->ID;

            $carrier->title       = $carrierData['title'];
            $carrier->code        = $carrierData['code'];
            $carrier->text        = $carrierData['text'];
            $carrier->releaseyear = $carrierData['releaseyear'];
            $carrier->save(false);

            // Insert the carrier tracks
            foreach ($carrierData['tracks'] as $i => $trackData)
            {
                $track = Track::findOne(['carrierID' => $carrier->ID, 'track' => $trackData['track']]);

                if (!$track) {
                    $track = new Track();
                }

                $track->carrierID = $carrier->ID;
                $track->masterID  = $carrier->ID;
                $track->track     = $trackData['track'];
                $track->title     = $trackData['title'];
                $track->text      = $trackData['text'];
                $track->composer1 = $trackData['composer1'];
                $track->duration  = $trackData['duration'];
                $track->keywords  = ' '; //@todo: add $trackData['keywords'];

                try {
                    $track->save(false);
                } catch (IntegrityException $e) {
                    //@todo: solve tracks sometime having similar constrains on carrierID_track
                    throw new IntegrityException($e->getMessage());
                } catch (ErrorException $e) {
                    throw new InvalidUploadException(InvalidUploadException::MEMORY_EXHAUSTED);
                } catch (Exception $e) {
                    // Give up
                    throw new TrackException(sprintf(
                         TrackException::MESSAGE_SAVE_ERROR,
                         $e->getMessage()
                     ));
                }
            }
        }

        // Duplicate/update label based on master record
        foreach($labels as $labelID)
        {
            $master = Label::findOne(['ID'=>$labelID])->findMaster();
            foreach ($sites as $siteID)
            {
                $master->duplicate($siteID);
            }
        }

        return true;
    }

    /**
     * Check if label is valid
     *
     * @param string $labelName
     *
     * @return bool
     */
    protected function isValidLabel($labelName)
    {
        return !!Label::findOne(['code' => $labelName]);
    }

    /**
     * @param string $carrierFile
     *
     * @return bool|array
     */
    protected function parseCarrier($carrierFile)
    {
        if (!$this->zip->locateName($carrierFile)) {
            return false;
        }

        $data    = array_map('trim', explode(PHP_EOL, $this->zip->getFromName($carrierFile)));
        $carrier = [
            'title'       => $data[0],
            'code'        => $data[2],
            'text'        => $data[3],
            'releaseyear' => $data[4],
            'categories'  => [],
            'label'       => [
                'title' => $data[1],
                'code'  => $data[10]
            ]
        ];

        for ($row=5; $row<10; $row++) {
            if (!empty($data[$row])) {
                $carrier['categories'][] = $data[$row];
            }
        }

        return $carrier;
    }

    protected function parseInlay($carrier, $inlayFile)
    {
        if (!$this->zip->locateName($inlayFile)) {
            return false;
        }

        $inlayTargetPath = \Yii::getAlias('@runtime/upload/_inlays/');
        $this->zip->extractTo($inlayTargetPath, $inlayFile);

        return Image::generateThumbnails('carrier', $carrier['code'], $inlayTargetPath . $inlayFile);
    }

    /**
     * @param string $trackFile
     *
     * @throws TrackException
     *
     * @return bool|array
     */
    protected function parseTracks($trackFile)
    {
        if (!$this->zip->locateName($trackFile)) {
            return false;
        }

        $tracks  = [];
        $rawData = $this->zip->getFromName($trackFile);
        $data    = array_map('trim', preg_split('/\r\n|\r|\n/', $rawData));

        foreach($data as $i=>$trackData) {
            if (empty($trackData)) continue;

            $trackNum    = $i + 1;
            $trackData   = array_map('trim', explode("\t", $trackData));
            $title       = $trackData[0];
            $description = count($trackData) > 3 ? $trackData[1] : ' ';
            $composer1   = count($trackData) > 4 ? $trackData[2] : ' ';

            try {
                list($minutes, $seconds) = explode(':', array_pop($trackData));
                $duration = 60 * $minutes + $seconds;
            } catch (ErrorException $e) {
                throw new TrackException( sprintf(TrackException::MESSAGE_INVALID_DURATION, $trackNum));
            }

            $track = [
                'track'     => $trackNum,
                'title'     => $title,
                'text'      => $description,
                'composer1' => $composer1,
                'duration'  => $duration
            ];

            $tracks[] = $track;
        }

        return $tracks;
    }
}
