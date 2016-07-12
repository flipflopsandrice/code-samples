<?php
/**
 * Namespace
 */
namespace TS\Model;

/**
 * Class PaymentMethod
 *
 * @package TS\Model
 */
class PaymentMethod implements ArrayModelInterface
{
    /* Class constants */
    const PAYMENT_TYPE_CARD   = 'CARD';
    const PAYMENT_TYPE_ISSUER = 'ISSUER';

    /** @var string */
    private $id;

    /** @var string */
    private $name;

    /** @var string */
    private $type;

    /** @var PaymentIssuer[] */
    private $issuers;

    /** @var string[] */
    private $cards;

    /** @var bool */
    private $hasCvc;

    /** @var null|int */
    private $sortPriority;

    /**
     * @param string          $id
     * @param string          $name
     * @param string          $type
     * @param PaymentIssuer[] $issuers
     * @param string[]        $cards
     *
     * @todo: implement hasCvc for specific card types without Cvc
     */
    public function __construct(
        $id, $name, $type, $issuers=null, $cards=[]
    ) {
        $this->id      = $id;
        $this->name    = $name;
        $this->type    = $type;
        $this->issuers = $issuers;
        $this->cards   = $cards;
        $this->hasCvc  = $this->id !== 'bcmc';
    }

    /**
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @return PaymentIssuer[]
     */
    public function getIssuers()
    {
        return $this->issuers ?: [];
    }

    /**
     * @param $issuerId
     *
     * @return bool|PaymentIssuer
     */
    public function getIssuer($issuerId)
    {
        foreach($this->issuers as $issuer) {
            if ($issuer->getId() === $issuerId) {
                return $issuer;
            }
        }
        return false;
    }

    /**
     * Sets the priority that is used when sorting a collection (PaymentMethods).
     * The higher the priority, the more important the paymentmethod is.
     *
     * @param $sortPriority
     */
    public function setSortPriority($sortPriority)
    {
        $this->sortPriority = $sortPriority;
    }

    /**
     * @return mixed
     */
    public function getSortPriority()
    {
        return $this->sortPriority;
    }

    /**
     * @return array
     */
    public function toArray()
    {
        $array = [
            'id'   => $this->id,
            'name' => $this->name,
            'type' => $this->type
        ];

        if ($this->issuers) {
            $array['issuers'] = array_map(function($issuer) {
                return $issuer->toArray();
            }, $this->issuers);
        }

        if ($this->cards) {
            $array['cards'] = $this->cards;
        }

        if ($this->hasCvc) {
            $array['hasCvc'] = $this->hasCvc;
        }

        if (
            $array['type'] === self::PAYMENT_TYPE_ISSUER &&
            !empty($array['issuers'])
        ) {
            /* Prepare a machine-readable icon name so we can render it in the frontend */
            foreach($array['issuers'] as &$issuer) {
                $issuer['icon'] = preg_replace(
                    '/[^a-z0-9]/',
                    '-',
                    strtolower(trim(strip_tags($issuer['name'])))
                );
            }
        }

        return $array;
    }
}
