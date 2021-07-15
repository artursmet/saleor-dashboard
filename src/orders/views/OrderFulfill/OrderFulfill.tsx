import { WindowTitle } from "@saleor/components/WindowTitle";
import useNavigator from "@saleor/hooks/useNavigator";
import useNotifier from "@saleor/hooks/useNotifier";
import { extractMutationErrors } from "@saleor/misc";
import OrderFulfillPage, {
  OrderFulfillSubmitData
} from "@saleor/orders/components/OrderFulfillPage";
import { useOrderFulfill } from "@saleor/orders/mutations";
import { useOrderFulfillData } from "@saleor/orders/queries";
import { orderUrl } from "@saleor/orders/urls";
import { mapEdgesToItems } from "@saleor/utils/maps";
import { useWarehouseList } from "@saleor/warehouses/queries";
import React from "react";
import { useIntl } from "react-intl";

export interface OrderFulfillProps {
  orderId: string;
}

const OrderFulfill: React.FC<OrderFulfillProps> = ({ orderId }) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();
  const { data, loading } = useOrderFulfillData({
    displayLoader: true,
    variables: {
      orderId
    }
  });

  const { data: warehouseData, loading: warehousesLoading } = useWarehouseList({
    displayLoader: true,
    variables: {
      first: 20
    }
  });

  const [fulfillOrder, fulfillOrderOpts] = useOrderFulfill({
    onCompleted: data => {
      if (data.orderFulfill.errors.length === 0) {
        navigate(orderUrl(orderId), true);
        notify({
          status: "success",
          text: intl.formatMessage({
            defaultMessage: "Fulfilled Items",
            description: "order fulfilled success message"
          })
        });
      }
    }
  });

  const handleSubmit = (formData: OrderFulfillSubmitData) =>
    extractMutationErrors(
      fulfillOrder({
        variables: {
          input: {
            lines: formData.items.map(line => ({
              orderLineId: line.id,
              stocks: line.value
            })),
            notifyCustomer: formData.sendInfo
          },
          orderId
        }
      })
    );

  return (
    <>
      <WindowTitle
        title={
          data?.order?.number
            ? intl.formatMessage(
                {
                  defaultMessage: "Fulfill Order #{orderNumber}",
                  description: "window title"
                },
                {
                  orderNumber: data.order.number
                }
              )
            : intl.formatMessage({
                defaultMessage: "Fulfill Order",
                description: "window title"
              })
        }
      />
      <OrderFulfillPage
        loading={loading || warehousesLoading || fulfillOrderOpts.loading}
        errors={fulfillOrderOpts.data?.orderFulfill.errors}
        onBack={() => navigate(orderUrl(orderId))}
        onSubmit={handleSubmit}
        order={data?.order}
        saveButtonBar="default"
        warehouses={mapEdgesToItems(warehouseData?.warehouses)}
      />
    </>
  );
};

OrderFulfill.displayName = "OrderFulfill";
export default OrderFulfill;
