<?php

/**
 * Unit tests for the PaymentMethodBuilderTest.
 *
 * @category TSTest
 * @author   Erik Beijerman <erik.beijerman@thorongil.com>
 */
class PaymentMethodBuilderTest extends \TSTest\BaseTest
{
    /**
     * Test the PaymentMethod builder
     */
    public function testBuild()
    {
        $mockModel     = $this->getMockPaymentMethod();
        $PaymentMethod = \TS\Model\Builder\PaymentMethodBuilder::build($mockModel->toArray());

        $this->assertInstanceOf('TS\Model\PaymentMethod', $PaymentMethod);
        $this->assertEquals($mockModel->getId(), $PaymentMethod->getId());
    }

    /**
     * Test the PaymentMethod builder that fails on missing data
     */
    public function testBuildWithMissingData()
    {
        $this->setExpectedException(
            'TS\Exception\InvalidPaymentMethodModelException',
            sprintf(\TS\Exception\InvalidModelException::EXCEPTION_MISSING_DATA, 'id')
        );

        $PaymentMethod = \TS\Model\Builder\PaymentMethodBuilder::build([]);
        $arrPaymentMethod  = $PaymentMethod->toArray();
        unset($arrPaymentMethod['id']);
        \TS\Model\Builder\PaymentMethodBuilder::build($arrPaymentMethod);
    }

    /**
     * Test the PaymentMethod builder that fails on invalid data
     */
    public function testBuildWithInvalidData()
    {
        $this->setExpectedException(
            'TS\Exception\InvalidPaymentMethodModelException',
            sprintf(\TS\Exception\InvalidModelException::EXCEPTION_INVALID_DATA, 'id', 'string')
        );

        $mockModel     = $this->getMockPaymentMethod();
        $PaymentMethod = \TS\Model\Builder\PaymentMethodBuilder::build($mockModel->toArray());
        $arrPaymentMethod  = $PaymentMethod->toArray();
        $arrPaymentMethod['id'] = 12345;
        \TS\Model\Builder\PaymentMethodBuilder::build($arrPaymentMethod);
    }
}
