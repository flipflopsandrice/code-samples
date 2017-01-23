<?php

use TS\Controller\CartController;

/**
 * Unit tests for the CartController.
 *
 * @category TSTest
 * @author   Erik Beijerman <erik.beijerman@thorongil.com>
 */
class CartControllerTest extends \TSTest\BaseTest
{
    /**
     * Test getting items from cart
     */
    public function testGetItems()
    {
        $app = $this->createApplication();
        $this->setMockCartService($app, ['getItems'=>[]], 2);
        $this->setMockRequest($app, [], 0);
        $this->setMockView($app, []);
        $this->setMockBillingService($app, []);

        $request          = $this->getMockRequest();
        $request->headers = $this->getMockHeaderBag('');

        $controller = new CartController($app);
        $faq        = $controller->getItems($request);

        $this->assertNotEmpty($faq);
        $this->assertInstanceOf('Symfony\\Component\\HttpFoundation\\Response', $faq);
    }

    /**
     * Test add items to cart that fails because of incorrect product/qty
     */
    public function testAddItemsFailsBecauseIncorrectProductAndQty()
    {
        $app = $this->createApplication();
        $this->setMockRequest($app, [], 0);
        $this->setMockView($app, []);
        $this->setMockCartService($app, []);
        $this->setMockBillingService($app, []);
        $request = $this->getMockRequest();

        $this->setExpectedException('TS\Exception\CartAddException', \TS\Exception\CartAddException::EXCEPTION_NO_PRODUCT_ID_OR_QTY);

        $controller = new CartController($app);
        $controller->addItem($request);
    }

    /**
     * Test deleting an item from the cart that fails
     */
    public function testDeleteItemThatFails()
    {
        $app = $this->createApplication();
        $this->setMockSessionBag($app, [], ['get'=>1, 'set'=>0, 'remove'=>0]);
        $this->setMockRequest($app, [], 0);
        $this->setMockView($app, []);
        $this->setMockCartService($app, ['deleteItem' => new \TS\Exception\CartDeleteException()], 1);
        $this->setMockBillingService($app, []);
        $request = $this->getMockRequest();

        $this->setExpectedException('TS\Exception\CartDeleteException', \TS\Exception\CartDeleteException::MESSAGE_UNABLE_TO_DELETE);

        $controller = new CartController($app);
        $controller->deleteItem($request);
    }

    /**
     * Test if we can get the cart service
     */
    public function testGetService()
    {
        $app = $this->createApplication();
        $this->setMockRequest($app, [], 0);
        $this->setMockView($app, []);
        $this->setMockCartService($app, []);

        $controller = new CartController($app);
        $service = $controller->getService();

        $this->assertNotEmpty($service);
        $this->assertInstanceOf('TS\\Service\\CartService', $service);
    }

    /**
     * Test if we can get the cart service that fails
     */
    public function testGetServiceThatFails()
    {
        $app = $this->createApplication();
        $this->setMockRequest($app, [], 0);
        $this->setMockView($app, []);
        $this->setMockPaymentService($app, []);
        $this->setMockCartService($app, []);

        // Set cart service to a different service to trigger an exception
        $app['cart.service'] = $app['payment.service'];

        $this->setExpectedException('TS\Exception\ServiceNotFoundException', sprintf(\TS\Exception\ServiceNotFoundException::EXCEPTION_UNABLE_TO_LOCATE_SERVICE, 'CartService'));

        $controller = new CartController($app);
        $controller->getService();
    }
}
