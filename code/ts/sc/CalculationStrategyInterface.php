<?php

namespace Services\Calculator\Strategy;

interface CalculationStrategyInterface
{
    function calculate($channel, $products);
    function getProductTotals($products);
}