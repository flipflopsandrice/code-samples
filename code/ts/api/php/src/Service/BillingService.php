<?php

/**
 * Namespace
 */
namespace TS\Service;

use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ServerException;
use TS\Exception\OrderCreateException;
use TS\Exception\OrderUpdateException;
use TS\Model\BaseOrder;
use TS\Model\Builder\OrderBuilder;
use TS\Model\Builder\RegistrationOrderBuilder;
use TS\Model\Channel;
use TS\Model\Order;
use TS\Model\PaymentMethod;
use TS\Model\RegistrationOrder;

/**
 * The OrderService calls the channel order API in the sales channel
 * and handles creating orders.
 * @category   TS
 * @package    Service
 * @author     Erik Beijerman <erik.beijerman@thorongil.com>
 * @copyright  <redacted>>
 * @since      1.0.0
 */
class OrderService extends AbstractService
{
    /* Class constants */
    const URL_ORDER = 'order';
    const ORDER_SESSION_KEY = 'order';

    /**
     * Call the Sales Channel API to create an order for a specific channel ID.
     * Returns the order if successful.
     *
     * @param Channel       $channel
     * @param string        $firstname
     * @param string        $lastname
     * @param string        $email
     * @param string        $country
     * @param string        $ipAddress
     * @param null          $birthdate
     * @param null          $gender
     * @param null          $city
     * @param bool|false    $optIn
     * @param PaymentMethod $paymentMethod
     * @param array         $reservationIds
     * @param array         $productIds
     * @param array         $amounts
     *
     * @return Order|RegistrationOrder
     * @throws OrderCreateException
     */
    public function createOrder(
        Channel $channel, $firstname, $lastname, $email, $country, $ipAddress, array $reservationIds, array $productIds, array $amounts, PaymentMethod $paymentMethod=null, $birthdate=null, $gender=null, $city=null, $optIn=false, $language=null
    )
    {
        /* Set the data */
        $data = [
            'firstname'         => $firstname,
            'lastname'          => $lastname,
            'email'             => $email,
            'ip_address'        => $ipAddress,
            'birthdate'         => $birthdate,
            'gender'            => $gender,
            'city'              => $city,
            'opt_in'            => $optIn ? 'true' : 'false',
            'country'           => $country,
            'language'          => $language,
            'reservation_ids[]' => implode(',', $reservationIds),
            'product_ids[]'     => implode(',', $productIds),
            'amounts[]'         => implode(',', $amounts)
        ];

        /* Add the payment method if this is not a registration channel */
        if (!$channel->isTypeRegistration()) {
            if (empty($paymentMethod)) {
                throw new OrderCreateException(OrderCreateException::EXCEPTION_MISSING_PAYMENT_METHOD);
            }
            $data['payment_method'] = $paymentMethod->getId();
        }

        $this->log->addDebug('[order] Creating order', $data);

        /* Call the service */
        try {
            $result = $this->_post(
                self::API_TYPE_SALESCHANNEL,
                self::URL_ORDER,
                ['requestId' => $channel->getRequestId()],
                ['body' => $data]);
        } catch (\Exception $e) {
            throw new OrderCreateException(OrderCreateException::EXCEPTION_API_ERROR, 0, $e);
        }

        /* Throw exception when no id is set in result */
        if (empty($result)) {
            throw new OrderCreateException(OrderCreateException::EXCEPTION_EMPTY_RESPONSE);
        }

        /* Return a registration order if we are in a registration channel */
        if ($channel->isTypeRegistration()) {
            $order = RegistrationOrderBuilder::build($result);
        } else {
            /* Return a normal order */
            $order = OrderBuilder::build($result);
        }

        $this->log->addDebug('[order] Create order', [
            'order' => $order->toArray()
        ]);

        return $order;
    }

    /**
     * Store the order into session storage.
     *
     * @param BaseOrder $order
     */
    public function setOrder(BaseOrder $order)
    {
        $this->session->set(self::ORDER_SESSION_KEY, $order->toArray());
    }

    /**
     * Retrieve the order (if present) from session storage.
     * @return bool|BaseOrder
     */
    public function getOrder()
    {
        $order = $this->session->get(self::ORDER_SESSION_KEY, false);

        if (!$order) {
            return false;
        }

        /* Detect which type of order we are dealing with */
        if ($order['type'] === BaseOrder::TYPE_REGISTRATION) {
            return RegistrationOrderBuilder::build($order);
        }
        return OrderBuilder::build($order);
    }

    /**
     * Remove the order from session storage.
     *
     * @return void
     */
    public function deleteOrder()
    {
        $this->session->remove(self::ORDER_SESSION_KEY);
    }

    /**
     * Update the order status through the service.
     *
     * @param $status
     *
     * @return bool|Order
     * @throws OrderUpdateException
     */
    public function updateOrderStatus($status)
    {
        $order = $this->getOrder();

        /* Throw exception if order is missing */
        if (!$order) {
            throw new OrderUpdateException(OrderUpdateException::EXCEPTION_NOT_FOUND);
        }

        /* Set the new order status */
        $order->setStatus($status);
        $this->setOrder($order);

        /* Return the Order to be consumed */
        return $order;
    }
}
