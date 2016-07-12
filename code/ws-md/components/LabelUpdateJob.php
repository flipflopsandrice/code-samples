<?php

namespace common\components;

use api\components\GearmanJobWrapper;
use api\modules\v1\models\GearmanJobStatus;
use backend\exceptions\JobException;
use yii\base\ErrorException;
use yii\base\Exception;

class LabelUpdateJob
{
    const _JOB_NAME         = 'audioBundleUpdate';
    const _STATUS_INIT      = 'init';
    const _STATUS_WORKING   = 'working';
    const _STATUS_ERROR     = 'error';
    const _STATUS_COMPLETED = 'completed';

    /**
     * @var GearmanJobStatus
     */
    private $jobStatus;

    /**
     * @throws Exception
     * @param null $ID
     */
    public function __construct($ID=null)
    {
        if (!empty($ID)) {
            $this->jobStatus = GearmanJobStatus::findOne($ID);

            if (!$this->jobStatus) {
                throw new Exception('Job not found');
            }

            return true;
        }

        // Initialize a new job
        $this->jobStatus = new GearmanJobStatus();
        $this->jobStatus->gearman_job_identifier = self::_JOB_NAME;
        $this->jobStatus->user_id = \Yii::$app->user->ID;
        $this->jobStatus->result = serialize([
            'status' => self::_STATUS_INIT,
            'data'   => []
        ]);

        return true;
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->jobStatus->app_job_id;
    }

    /**
     * @return array|null
     */
    public function getData()
    {
        $result = unserialize($this->jobStatus->result);

        if (empty($result['data'])) {
            return null;
        }

        return $result['data'];
    }

    /**
     * @return string
     */
    public function getStatus()
    {
        try {
            $result = unserialize($this->jobStatus->result);
        } catch (ErrorException $e) {
            $result = unserialize($this->jobStatus->result);
        }

        if (empty($result['status'])) {
            return self::_STATUS_INIT;
        }

        return $result['status'];
    }

    /**
     * @param $parameters
     *
     * @return GearmanJobStatus|bool
     * @throws JobException
     */
    public function start($parameters)
    {
        if (!$this->jobStatus->isNewRecord) {
            return $this->jobStatus->save();
        }

        try {
            $this->jobStatus = GearmanJobWrapper::background(self::_JOB_NAME, $parameters);
        } catch (ErrorException $e) {
            throw new JobException( JobException::MESSAGE_CANNOT_START_JOB );
        }

        return $this->jobStatus;
    }

    /**
     * @throws \Exception
     */
    public function clear()
    {
        if ($this->jobStatus) {
            $this->jobStatus->delete();
        }
    }
}
