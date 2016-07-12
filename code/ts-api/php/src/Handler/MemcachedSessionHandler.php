<?php

namespace TS\Handler;

use Symfony\Component\HttpFoundation\Session\Storage\Handler\MemcachedSessionHandler as BaseMemcachedSessionHandler;
use TS\Exception\MemcachedSessionHandlerException;

/**
 * This is a wrapper for Symfony's MemcacheSessionHandler so we can inject the
 * custom parameters for the ElastiCacheCluster client php-memcached extension.
 *
 * @package TS\Handler
 */
class MemcachedSessionHandler
{
    /** @var BaseMemcachedSessionHandler */
    private $handle;

    /** @var  \Memcached $memcached */
    private $memcached;

    /**
     * @param array $servers Assoc array of servers [host:'',port:'']
     * @param bool $dynamic  Enable the AmazonElastiCache dynamic node discovery
     *
     * @see http://docs.aws.amazon.com/AmazonElastiCache/latest/UserGuide/AutoDiscovery.html#AutoDiscovery.ModifyAppPHP
     *
     * @throws MemcachedSessionHandlerException
     */
    public function __construct(array $servers, $dynamic=false)
    {
        if (!class_exists('\Memcached')) {
            throw new MemcachedSessionHandlerException(
                MemcachedSessionHandlerException::EXCEPTION_EXTENSION_MISSING
            );
        }

        /* Initiate Memcached extension */
        $memcached = new \Memcached();

        /* If php-memcached is the AmazonElastiCache client, set the dynamic node options  */
        if (
            $dynamic
            && defined('\Memcached::OPT_CLIENT_MODE')
            && defined('\Memcached::DYNAMIC_CLIENT_MODE')
        ) {
            $memcached->setOption(
                \Memcached::OPT_CLIENT_MODE,
                \Memcached::DYNAMIC_CLIENT_MODE
            );
        }

        /* Add the remote servers to memcached */
        foreach($servers as $server) {
            if (!$memcached->addServer($server['host'], $server['port'])) {
                throw new MemcachedSessionHandlerException(
                    sprintf(MemcachedSessionHandlerException::EXCEPTION_ADD_SERVER, $server['host'], $server['port'])
                );
            }
        }

        /* Attempt to read from server */
        if ($memcached->getVersion() === false) {
            throw new MemcachedSessionHandlerException(MemcachedSessionHandlerException::EXCEPTION_COULD_NOT_CONNECT);
        }

        $this->memcached = $memcached;
        $this->handle    = new BaseMemcachedSessionHandler($memcached);
    }

    /**
     * Return the status of the \Memcached instance
     *
     * @return array
     */
    public function getStats()
    {
        return $this->memcached->getStats();
    }

    /**
     * Return the handle by which the session storage is used.
     *
     * @return BaseMemcachedSessionHandler
     * @throws MemcachedSessionHandlerException
     */
    public function getHandle()
    {
        if (!$this->handle) {
            throw new MemcachedSessionHandlerException(MemcachedSessionHandlerException::EXCEPTION_NOT_INITIALIZED);
        }
        return $this->handle;
    }
}
