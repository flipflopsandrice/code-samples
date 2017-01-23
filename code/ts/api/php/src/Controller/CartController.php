<?php

/**
 * Namespace
 */
namespace TS\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use TS\Exception\CartAddException;
use TS\Exception\CartDeleteException;
use TS\Exception\CartNotFoundException;
use TS\Exception\ServiceNotFoundException;
use TS\Service\CartService;

/**
 * The CartController exposes methods to use with the routes
 * for user interaction with their shopping cart. It uses
 * the CartService to provide the controller with data.
 * @package   TS
 * @category  Controller
 * @author    Erik Beijerman <erik.beijerman@thorongil.com>
 */
class CartController extends AbstractController
{
    /* View constants */
    const VIEW_CART = 'cart';

    /**
     * Return the items in the users cart. For now the cart is persisted
     * in the users' session. The cart contains an array of products
     * with their price, quantity and reservationId (if persisted to a datastore)
     * @param   Request $request
     * @return  Response
     */
    public function getItems(Request $request)
    {
        /* Validate the request */
        if ($redirect = $this->validateRequest()) {
            return $redirect;
        }

        $service    = $this->getService();
        $items      = $service->getItems();

        /* Store the referer if it's available and does not contain the
           cart.get route (without language suffix) */
        if (
            ($referer = $request->headers->get('referer')) &&
            !stristr($referer, $this->getUrl('cart.get', ['suffix' => '']))
        ) {
            $service->setReferer($referer);
        }

        /* Loop items and add delete URL */
        foreach ($items as $productId => &$item) {
            $item->setDeleteUrl($this->getUrl('cart.delete', [
                'productId' => $productId
            ]));
        }

        /* Respond */
        return $this->respond([], self::VIEW_CART);
    }

    /**
     * Add a new item to the cart, if the item already exists in the cart
     * the quantities will be updated by our service. This way the
     * controller does not contain any logic about determining what to
     * do with our data.
     * @param   Request $request
     * @throws  CartNotFoundException
     * @throws  CartAddException
     * @return  Response
     */
    public function addItem(Request $request)
    {
        /* Validate the request */
        if ($redirect = $this->validateRequest()) {
            return $redirect;
        }

        $requestId   = $request->get('requestId');
        $eventId     = $request->get('eventId');
        $productId   = $request->get('productId');
        $quantity    = intval($request->get('qty'));
        $redirectUrl = $request->get('redirectUrl') ? base64_decode($request->get('redirectUrl')) : null;

        if (!$productId || ! $quantity) {
            throw new CartAddException(CartAddException::EXCEPTION_NO_PRODUCT_ID_OR_QTY);
        }

        try {
            $this->getService()->addItem($requestId, $eventId, $productId, $quantity);
        } catch (\Exception $e) {
            throw new CartAddException(CartAddException::EXCEPTION_UNABLE_TO_ADD_ITEM, 0, $e);
        }

        /* Set flash message in session */
        $this->app['session']->getFlashBag()->set('cartAddedItems', $quantity);

        /* Redirect to the specified URL */
        if ($redirectUrl) {
            return $this->app->redirect($redirectUrl);
        }

        return $this->redirect('cart.get');
    }

    /**
     * Delete an item from the users' cart. We check if the item
     * exists, and if not throw an Exception.
     * @param  Request $request
     * @throws CartNotFoundException
     * @throws CartDeleteException
     * @return Response
     */
    public function deleteItem(Request $request)
    {
        /* Validate the request */
        if ($redirect = $this->validateRequest()) {
            return $redirect;
        }

        $requestId = $request->get('requestId');
        $productId = $request->get('productId');
        try {
            $this->getService()->deleteItem($requestId, $productId);
        } catch (CartNotFoundException $e) {
            //ignore cart not found
        } catch (\Exception $e) {
            throw new CartDeleteException(CartDeleteException::MESSAGE_UNABLE_TO_DELETE, 0, $e);
        }
        return $this->redirect('cart.get');
    }

    /**
     * Clear all items from the users' cart.
     * @param  Request $request
     * @throws CartNotFoundException
     * @return Response
     */
    public function clearItems(Request $request)
    {
        /* Validate the request */
        if ($redirect = $this->validateRequest()) {
            return $redirect;
        }

        $requestId = $request->get('requestId');
        try {
            $this->getService()->deleteItems($requestId);
        } catch (CartNotFoundException $e) {
            //ignore cart not found
        }
        return $this->redirect('event.list');
    }

    /**
     * Return the CartService
     * @throws ServiceNotFoundException
     * @return CartService
     */
    public function getService()
    {
        $service = $this->app['cart.service'];
        if (!($service instanceof CartService)) {
            throw new ServiceNotFoundException(
                ServiceNotFoundException::EXCEPTION_UNABLE_TO_LOCATE_SERVICE,
                'CartService'
            );
        }
        return $service;
    }

    /**
     * @inheritdoc
     */
    protected function validateRequest()
    {
        /* Advance if we have valid billing information */
        if (
            $this->haveValidCart() &&
            $this->haveValidBilling()
        ) {
            return $this->redirect('payment.payments');
        }
        return false;
    }
}
