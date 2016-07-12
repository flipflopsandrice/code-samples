<?php

/**
 * Unit tests for the PaymentMethodsBuilderTest.
 *
 * @category TSTest
 * @author   Erik Beijerman <erik.beijerman@thorongil.com>
 */
class PaymentMethodsBuilderTest extends \TSTest\BaseTest
{
    /**
     * Test the PaymentMethods builder
     */
    public function testBuild()
    {
        $mockModel     = $this->getMockPaymentMethods();
        $PaymentMethods = \TS\Model\Builder\PaymentMethodsBuilder::build($mockModel->toArray());

        $this->assertInstanceOf('TS\Model\PaymentMethods', $PaymentMethods);
        $this->assertEquals($mockModel->get('CC')->getId(), $PaymentMethods->get('CC')->getId());
    }

    /**
     * Test the PaymentMethods builder that fails on missing data
     */
    public function testBuildWithMissingData()
    {
        $this->setExpectedException(
            'TS\Exception\InvalidPaymentMethodsModelException',
            \TS\Exception\InvalidPaymentMethodsModelException::MESSAGE_PAYMENT_METHODS_EMPTY
        );

        \TS\Model\Builder\PaymentMethodsBuilder::build([]);
    }
}
