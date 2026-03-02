import CreateOrderForm from "@/components/admin/CreateOrderForm";

export default function NewOrderPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold text-white">Новый заказ</h1>
      <CreateOrderForm />
    </div>
  );
}