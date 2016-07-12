<?php

namespace Services\Calculator\Strategy;

class BaseCalculation
{
    /**
     * Calculates the productTotals, productCount and totalAmount for products
     *
     * @param  array $products
     * @return array
     */
    public function getProductTotals($products)
    {
        $productTotals = [];
        $productCount  = 0;
        $totalAmount   = 0;

        foreach($products as $product) {
            $productTotal = $product["quantity"] * $product["ticket"]["price"];

            $productTotals[ $product["id"] ]  = $productTotal;
            $productCount                    += $product["quantity"];
            $totalAmount                     += $productTotal;
        }

        return array($productTotals, $productCount, $totalAmount);
    }
}