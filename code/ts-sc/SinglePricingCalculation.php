<?php

namespace Services\Calculator\Strategy;

class SinglePricingCalculation extends BaseCalculation implements CalculationStrategyInterface
{
    /**
     * @param  array $channel
     * @param  array $products
     * @return array
     */
    public function calculate($channel, $products)
    {
        $kickbacPercentagePerTicket = $channel["commissions"]["account_commission"] + $channel["commissions"]["channel_commission"];
        $percentageFee               = 0;

        list($productTotals,
             $productCount,
             $totalAmount) = $this->getProductTotals($products);

        $serviceCharge  = ($productCount * $kickbacPercentagePerTicket) + ($totalAmount * $percentageFee);
        $subTotalAmount = $totalAmount + $serviceCharge;

        $result = [
            "products"       => $productTotals,
            "total"          => $totalAmount,
            "service_charge" => $serviceCharge,
            "order_total"    => $subTotalAmount
        ];

        return $result;
    }
}
