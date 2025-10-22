import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>
      <div className="max-w-2xl space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Name:</span> {user?.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">My Orders</h2>
          <p className="text-gray-600">No orders yet.</p>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Settings</h2>
          <button className="text-thrift-green hover:underline">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}