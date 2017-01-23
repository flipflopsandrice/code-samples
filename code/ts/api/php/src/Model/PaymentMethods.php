<?php
/**
 * Namespace
 */
namespace TS\Model;

/**
 * Class PaymentMethods
 *
 * @package TS\Model
 */
class PaymentMethods implements ArrayModelInterface
{
    /** @var PaymentMethods[] */
    private $paymentMethods;

    /**
     * @param PaymentMethods[] $paymentMethods
     */
    public function __construct(array $paymentMethods)
    {
        $this->paymentMethods = $paymentMethods;
    }

    /**
     * @param string $type
     * @param array  $excludeIds
     */
    public function clearTypes($type, array $excludeIds=[])
    {
        $this->paymentMethods = array_filter($this->paymentMethods, function(PaymentMethod $paymethod) use ($type, $excludeIds) {
            return $paymethod->getType() !== $type && !in_array($paymethod->getId(), $excludeIds);
        });
    }

    /**
     * @param  string $type
     * @return bool
     */
    public function hasTypes($type)
    {
        return !empty(array_filter($this->paymentMethods, function($paymethod) use ($type) {
            return $paymethod->getType() === $type;
        }));
    }

    /**
     * @param PaymentMethod $paymentMethod
     */
    public function append(PaymentMethod $paymentMethod)
    {
        $this->paymentMethods[] = $paymentMethod;
    }

    /**
     * @param $paymentMethodId
     *
     * @return bool|PaymentMethod
     */
    public function get($paymentMethodId)
    {
        foreach($this->paymentMethods as $paymentMethod) {
            if ($paymentMethod->getId() === $paymentMethodId) {
                return $paymentMethod;
            }
        }
        return false;
    }

    public function sort()
    {
        usort($this->paymentMethods, array($this, 'sortByPriority'));
    }

    /**
     * @return array
     */
    public function toArray()
    {
        return array_map(function(PaymentMethod $issuer) {
            return $issuer->toArray();
        }, $this->paymentMethods);
    }

    /**
     * @param PaymentMethod $a
     * @param PaymentMethod $b
     *
     * @return bool
     */
    protected function sortByPriority(PaymentMethod $a, PaymentMethod $b)
    {
        return $a->getSortPriority() < $b->getSortPriority();
    }
}
