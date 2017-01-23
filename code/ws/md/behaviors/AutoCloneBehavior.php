<?php

namespace common\behaviors;

use yii\base\Behavior;
use yii\base\Exception;
use yii\base\InvalidConfigException;
use yii\db\BaseActiveRecord;

/**
 * Class AutoCloneBehavior
 *
 * @package common\behaviors
 *
 * @todo Dependency clones (e.g. cloning a label should clone all it's carriers)
 */
class AutoCloneBehavior extends Behavior
{
    /**
     * The column that identifies the master/clone relations (e.g.: siteID)
     *
     * @var string
     */
    public $masterColumn;

    /**
     * The ID all master copies are attached to
     *
     * @var int
     */
    public $masterID = 0;

    /**
     * The unique identifier by which a model is cloned (e.g.: code)
     *
     * @var array
     */
    public $uniqueIdentifiers = [];

    /**
     * Set to true if you explicitly want to skip validation and save the model.
     *
     * This is used when: a clone is saved, which tries to update the master, which again tries to update the clone
     * and causes an inifite loop.
     *
     * @var boolean
     */
    public $allowCloneMutation = false;

    /**
     * Child relations [ ModelClass => foreignKeyColumn ]
     *
     * @var array
     */
    public $children = [];

    /**
     * @inheritdoc
     * @var BaseActiveRecord
     */
    public $owner;

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();

        if (empty($this->masterColumn)) {
            throw new InvalidConfigException('Master column not set');
        }

        if (empty($this->uniqueIdentifiers)) {
            throw new InvalidConfigException('Unique identifier(s) not set');
        }
    }
    /**
     * @inheritdoc
     */
    public function events()
    {
        return [
            BaseActiveRecord::EVENT_BEFORE_INSERT => 'beforeSave',
            BaseActiveRecord::EVENT_BEFORE_UPDATE => 'beforeSave',
            BaseActiveRecord::EVENT_BEFORE_DELETE => 'beforeDelete',
            BaseActiveRecord::EVENT_AFTER_INSERT  => 'afterSave',
            BaseActiveRecord::EVENT_AFTER_UPDATE  => 'afterSave',
            BaseActiveRecord::EVENT_AFTER_DELETE  => 'afterDelete'
        ];
    }

    /**
     * Set the 'isValid' flag on the AR event based on whether this is a master copy or not
     *
     * @param $event
     *
     * @return mixed
     */
    public function beforeSave($event)
    {
        if (
            !$this->allowCloneMutation &&
            $this->owner->ID &&
            !$this->isMasterCopy()
        ) {
            if ($this->updateMaster()) {
                $event->isValid = false;
                return $event;
            }
        }

        return $event;
    }

    /**
     * If a 'master' copy is being saved, create or update any clones and clone relations
     *
     * @return bool
     */
    public function afterSave($event)
    {
        if (!$this->isMasterCopy()) {
            return false;
        }

        $clones = $this->findClones();

        foreach($clones as $clone) {
            $attributes = !empty($this->owner->getDirtyAttributes()) ? $this->owner->getDirtyAttributes() : $event->changedAttributes;

            unset($attributes[ array_shift($this->owner->primaryKey()) ]);
            unset($attributes[$this->masterColumn]);

            foreach ($attributes as $attribute => $value) {
                $clone->{$attribute} = $this->owner->{$attribute};
            }
            $clone->allowCloneMutation = true;
            $clone->save(false);
        }

        return true;
    }

    /**
     * Only allow deletion of master copies, or clones that are deleted through the master's::afterDelete (by
     * setting allowCloneMutation to true).
     *
     * @param $event
     *
     * @return mixed
     */
    public function beforeDelete($event)
    {
        if (
            !$this->allowCloneMutation &&
            !$this->isMasterCopy($event)
        ) {
            $master = $this->findMaster();
            $master->delete();

            $event->isValid = false;
            return $event;
        }

        return $event;
    }

    /**
     * If a 'master' copy is being deleted, also remove all clones
     *
     * @return bool
     */
    public function afterDelete($event)
    {
        if (!$this->isMasterCopy($event)) {
            return $event;
        }

        $clones = $this->findClones();
        foreach($clones as $clone) {
            $clone->allowCloneMutation = true;
            $clone->delete();
        }

        return $event;
    }

    /**
     * Duplicate/clone/update the current model to the $targetID, or find and update the appropriate clone
     *
     * @param $targetID
     *
     * @throws Exception
     * @return bool
     */
    public function duplicate($targetID)
    {
        $modelClass = $this->owner->className();
        $where      = [
            $this->masterColumn => $targetID
        ];

        foreach ($this->uniqueIdentifiers as $uniqueIdentifier) {
            $where[$uniqueIdentifier] = $this->owner->{$uniqueIdentifier};
        }

        /** @var BaseActiveRecord $model */
        $model = $modelClass::find()
            ->where($where)
            ->one();

        if (!$model) {
            $model = new $modelClass;
        }

        $model->attributes            = $this->owner->attributes;
        $model->{$this->masterColumn} = $targetID;
        $model->allowCloneMutation    = true;
        $model->save(false);

        // Clone all child relations
        $relations = $this->owner->children();
        if (!empty($relations))
        {
            foreach ($relations as $childModel=>$children)
            {
                foreach ($children as $child)
                {
                    $child->duplicate($model->ID);
                }
            }
        }

        return $model;
    }

    /**
     * Find the master above this clone
     *
     * @return mixed
     */
    public function findMaster()
    {
        if ($this->isMasterCopy()) {
            return $this->owner;
        }

        $modelClass = $this->owner->className();
        $where      = [
            $this->masterColumn => $this->masterID
        ];

        foreach($this->uniqueIdentifiers as $uniqueIdentifier) {
            $where[$uniqueIdentifier] = $this->owner->{$uniqueIdentifier};
        }

        $master = $modelClass::findOne($where);

        if (!$master) {
            $master = $this->duplicate($this->masterID);
        }

        return $master;
    }

    public function children()
    {
        $result = [];
        foreach($this->children as $model=>$keyColumn)
        {
            $result[$model] = $model::findAll([$keyColumn => $this->owner->ID]);
        }

        return $result;
    }

    /**
     * Update master based on the AR dirtyAttributes of the current owner
     *
     * @return bool
     * @throws Exception
     */
    private function updateMaster()
    {
        $master     = $this->findMaster();
        $attributes = $this->owner->dirtyAttributes;

        if (!$master) {
            return $this->duplicate($this->masterID);
        }

        foreach ($attributes as $attribute => $value) {
            $master->{$attribute} = $value;
        }

        $master->save();

        return true;
    }

    /**
     * Check whether the current owner is a master copy
     *
     * @return bool
     */
    private function isMasterCopy()
    {
        if (!empty($this->owner->getOldAttributes($this->masterColumn))) {
            return $this->owner->getOldAttribute($this->masterColumn) === $this->masterID;
        }

        return $this->owner->{$this->masterColumn} === $this->masterID;
    }

    /**
     * Find all clones attached to the current owner
     *
     * @return mixed
     */
    private function findClones()
    {
        $modelClass = $this->owner->className();
        foreach ($this->uniqueIdentifiers as $uniqueIdentifier) {
            $where[$uniqueIdentifier] = $this->owner->{$uniqueIdentifier};
        }

        return $modelClass::find()
            ->where($where)
            ->andWhere(['!=', $this->masterColumn,$this->masterID ])
            ->all();
    }
}
