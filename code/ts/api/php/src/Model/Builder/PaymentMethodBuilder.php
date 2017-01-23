<?php
/** Namespace */
namespace TS\Model\Builder;

use TS\Exception\InvalidModelException;
use TS\Exception\InvalidPaymentMethodModelException;
use TS\Model\PaymentMethod;

/**
 * Class PaymentMethodBuilder
 *
 * @package TS\Model\Builder
 */
class PaymentMethodBuilder extends AbstractBuilder
{
    /**
     * Produces a PaymentMethod object based on array input.
     *
     * @param array $parameters
     *
     * @return PaymentMethod
     */
    public static function build(array $parameters)
    {
        self::validate($parameters);

        $issuers = [];
        if (!empty($parameters['issuers'])) {
            foreach ($parameters['issuers'] as $issuer) {
                $issuers[] = PaymentIssuerBuilder::build($issuer);
            }
        }

        return new PaymentMethod(
            $parameters['id'],
            $parameters['name'],
            $parameters['type'],
            $issuers
        );
    }

    /**
     * Call our validator with the options for validation. Catch the exception
     * and forward as our own.
     *
     * @param array $parameters
     *
     * @throws InvalidPaymentMethodModelException
     * @return bool
     */
    public static function validate(array $parameters)
    {
        $options = [
            'id'      => self::TYPE_STRING,
            'name'    => self::TYPE_STRING,
            'type'    => self::TYPE_STRING,
            'issuers' => [self::TYPE_OPTIONAL, self::TYPE_ARRAY],
        ];

        try {
            return self::validator($parameters, $options);
        } catch (InvalidModelException $e) {
            throw new InvalidPaymentMethodModelException($e->getMessage());
        }
    }
}
