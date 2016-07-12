<?php

use TS\Service\OrderService;

/**
 * Unit tests for the OrderService.
 *
 * @category TSTest
 * @author   Erik Beijerman <erik.beijerman@thorongil.com>
 */
class OrderServiceTest extends \TSTest\BaseTest
{
    /**
     * Test creating an order.
     */
    public function testCreateOrder()
    {
        $requestId     = '53GQYKC9';
        $eventId       = 2000000001;
        $reservationId = '1298723938723948';
        $orderId       = 'OJAOIJOFSDA-#23489234234';
        $quantity      = 10;
        $ipAddress     = '192.168.2.200';
        $gender        = 'm';
        $optIn         = true;
        $country       = 'NL';
        $channel       = $this->getMockChannel($requestId);
        $language      = 'en';

        $mockReservation = $this->getMockReservation($requestId, $eventId, $reservationId, $quantity);
        $mockOrder = $this->getMockOrder($requestId, $eventId, $mockReservation->getProduct()->getId(), $orderId, \TS\Model\Order::STATUS_PAID, [$mockReservation->getProduct()]);

        $response = [
            'success' => true,
            'response' => $mockOrder->toArray()
        ];

        $app = $this->createApplication();
        $this->setMockGuzzle($app, $response, 'post', 1);

        $service = new OrderService($app);

        // Return value will be identical to $mockOrder
        $order = $service->createOrder(
            $channel,
            $eventId,
            $mockOrder->getLastname(),
            $mockOrder->getEMail(),
            $country,
            $ipAddress,
            [ ],
            [ ],
            [ ],
            null,
            $mockOrder->getBirthdate(),
            $gender,
            $mockOrder->getAddress(),
            $optIn,
            $language
        );

        $this->assertEquals($order->getId(), $mockOrder->getId());
        $this->assertEquals($order->toArray(), $order->toArray());
    }

    /**
     * Test creating an order that fails on api error.
     */
    public function testCreateOrderThatFailsOnApiError()
    {
        $requestId     = '53GQYKC9';
        $eventId       = 2000000001;
        $reservationId = '1298723938723948';
        $orderId       = 'OJAOIJOFSDA-#23489234234';
        $quantity      = 10;
        $ipAddress     = '192.168.2.200';
        $gender        = 'm';
        $optIn         = true;
        $language      = 'en';
        $country       = 'NL';
        $channel       = $this->getMockChannel($requestId);

        $mockReservation = $this->getMockReservation($requestId, $eventId, $reservationId, $quantity);
        $mockOrder = $this->getMockOrder($requestId, $eventId, $mockReservation->getProduct()->getId(), $orderId, \TS\Model\Order::STATUS_PAID, [$mockReservation->getProduct()]);

        $app = $this->createApplication();
        $this->setMockGuzzle($app, new \Exception(), 'post', 1);

        $this->setExpectedException('TS\Exception\OrderCreateException', \TS\Exception\OrderCreateException::EXCEPTION_API_ERROR);

        $service = new OrderService($app);
        $service->createOrder(
            $channel,
            $eventId,
            $mockOrder->getLastname(),
            $mockOrder->getEMail(),
            $country,
            $ipAddress,
            [ ],
            [ ],
            [ ],
            null,
            $mockOrder->getBirthdate(),
            $gender,
            $mockOrder->getAddress(),
            $optIn,
            $language
        );
    }

    /**
     * Test creating an order that fails on api error.
     */
    public function testCreateOrderThatFailsOnEmptyResult()
    {
        $requestId     = '53GQYKC9';
        $eventId       = 2000000001;
        $reservationId = '1298723938723948';
        $orderId       = 'OJAOIJOFSDA-#23489234234';
        $quantity      = 10;
        $ipAddress     = '192.168.2.200';
        $gender        = 'm';
        $optIn         = true;
        $country       = 'NL';
        $channel       = $this->getMockChannel($requestId);
        $language      = 'en';

        $mockReservation = $this->getMockReservation($requestId, $eventId, $reservationId, $quantity);
        $mockOrder = $this->getMockOrder($requestId, $eventId, $mockReservation->getProduct()->getId(), $orderId, \TS\Model\Order::STATUS_PAID, [$mockReservation->getProduct()]);

        $response = [
            'success'  => true,
            'response' => []
        ];

        $app = $this->createApplication();
        $this->setMockGuzzle($app, $response, 'post', 1);

        $this->setExpectedException('TS\Exception\OrderCreateException', \TS\Exception\OrderCreateException::EXCEPTION_EMPTY_RESPONSE);

        $service = new OrderService($app);
        $service->createOrder(
            $channel,
            $eventId,
            $mockOrder->getLastname(),
            $mockOrder->getEMail(),
            $country,
            $ipAddress,
            [ ],
            [ ],
            [ ],
            null,
            $mockOrder->getBirthdate(),
            $gender,
            $mockOrder->getAddress(),
            $optIn
        );
    }

    /**
     * Test setting an order.
     */
    public function testSetOrder()
    {
        $order = $this->getMockOrder(
            '53GQYKC9',
            2000000001,
            '1234PR0DUCT-29384u23-4234-adsf',
            2,
            \TS\Model\Order::STATUS_PAID,
            []
        );

        $app = $this->createApplication();
        $this->setMockSessionBag($app, [], ['get'=>0, 'set'=>1, 'remove'=>0]);

        $service = new OrderService($app);
        $service->setOrder($order);
    }

    /**
     * Test getting an order.
     */
    public function testGetOrder()
    {
        $order = $this->getMockOrder(
            '53GQYKC9',
            2000000001,
            '1234PR0DUCT-29384u23-4234-adsf',
            2,
            \TS\Model\Order::STATUS_PAID,
            []
        );

        $app = $this->createApplication();
        $this->setMockSessionBag($app, $order->toArray(), ['get'=>1, 'set'=>0, 'remove'=>0]);

        $service = new OrderService($app);
        $result  = $service->getOrder();

        $this->assertEquals($result, $order);
    }

    /**
     * Test deleting an order.
     */
    public function testDeleteOrder()
    {
        $order = $this->getMockOrder(
            '53GQYKC9',
            2000000001,
            '1234PR0DUCT-29384u23-4234-adsf',
            2,
            \TS\Model\Order::STATUS_PAID,
            []
        );

        $app = $this->createApplication();
        $this->setMockSessionBag($app, [], ['get'=>0, 'set'=>0, 'remove'=>1]);

        $service = new OrderService($app);
        $service->deleteOrder($order);
    }
}
