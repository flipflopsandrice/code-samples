<?php
/** Namespace */
namespace TS\Model\Builder;

use TS\Exception\InvalidPaymentMethodsModelException;
use TS\Model\PaymentMethod;
use TS\Model\PaymentMethods;

/**
 * Class PaymentMethodsBuilder
 *
 * @package TS\Model\Builder
 */
class PaymentMethodsBuilder extends AbstractBuilder
{
    /**
     * Produces a PaymentMethods object based on array input.
     *
     * @param array $parameters
     *
     * @return PaymentMethods
     */
    public static function build(array $parameters)
    {
        self::validate($parameters);

        $paymentMethods = [];
        foreach ($parameters as $paymentmethod) {
            $paymentMethods[] = PaymentMethodBuilder::build($paymentmethod);
        }

        return new PaymentMethods($paymentMethods);
    }

    /**
     * Call our validator with the options for validation. Catch the exception
     * and forward as our own.
     *
     * @param array $parameters
     *
     * @throws InvalidPaymentMethodsModelException
     * @return bool
     */
    public static function validate(array $parameters)
    {
        if (empty($parameters)) {
            throw new InvalidPaymentMethodsModelException(
                InvalidPaymentMethodsModelException::MESSAGE_PAYMENT_METHODS_EMPTY
            );
        }

        return true;
    }
}
