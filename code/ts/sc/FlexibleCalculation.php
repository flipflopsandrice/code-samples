<?php

namespace Services\Calculator\Strategy;

class FlexibleCalculation extends BaseCalculation implements CalculationStrategyInterface
{
    /**
     * @param  array $channel
     * @param  array $products
     * @return array
     */
    public function calculate($channel, $products)
    {
        $feePerTicket      = $channel["service_charge"]["fee_per_ticket"];
        $kickbackPerTicket = $channel["commissions"]["account_commission"] + $channel["commissions"]["channel_commission"];
        $percentageFee     = 0;

        list($productTotals,
             $productCount,
             $totalAmount) = $this->getProductTotals($products);

        $serviceCharge  = ($productCount * $feePerTicket) + ($productCount * $kickbackPerTicket) + ($totalAmount * $percentageFee);
        $subTotalAmount = $totalAmount + $serviceCharge;

        $result = [
            "products"       => $productTotals,
            "total"          => $totalAmount,
            "service_charge" => $serviceCharge,
            "sub_total"      => $subTotalAmount,
            "order_total"    => $subTotalAmount
        ];

        return $result;
    }
}
