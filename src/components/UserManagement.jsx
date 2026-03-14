import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLoading } from "../context/LoadingContext";
import { toast } from "react-hot-toast";
import {
    Search,
    Filter,
    X,
    User,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Grid3x3,
    List,
    ChevronRight,
    ShoppingBag,
    Clock,
    CheckCircle,
    XCircle,
    MoreVertical,
    Shield,
    Trash2
} from "lucide-react";

const UserManagement = () => {
    const { startLoading, stopLoading } = useLoading();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [viewMode, setViewMode] = useState("cards"); // "cards" or "list"
    const [searchTerm, setSearchTerm] = useState("");
    const [userOrders, setUserOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderSearchTerm, setOrderSearchTerm] = useState("");

    // Fetch Users
    const fetchUsers = async () => {
        startLoading();
        try {
            // Trying likely endpoints for user management
            const response = await axios.get(
                `/api/auth/users`
            );

            const data = response.data?.users || response.data?.data || [];
            setUsers(data.users);
            setFilteredUsers(data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
            // Fallback for demo/development if endpoint doesn't exist yet
            // toast.error("Failed to fetch users. Ensure API endpoint exists.");
            // Ensure we have an empty array at least
            setUsers([]);
            setFilteredUsers([]);
        } finally {
            stopLoading();
        }
    };

    // Fetch Orders for a specific user
    const fetchUserOrders = async (userId) => {
        setLoadingOrders(true);
        try {
            // We can filter from all orders or fetch specific user orders if endpoint exists
            const response = await axios.get(
                `/api/orders/user/${userId}`
            );
            setUserOrders(response.data?.data || response.data?.orders || []);
        } catch (error) {
            console.error("Error fetching user orders:", error);
            // Fallback: Fetch all and filter (less efficient but works if specific endpoint missing)
            try {
                const allOrdersRes = await axios.get(
                    `/api/orders/all`
                );
                const allOrders = allOrdersRes.data?.data?.orders || [];
                // Filter by customer ID if possible, or matches by phone/email
                // Assuming user object has _id
                const user = users.find(u => u._id === userId);
                if (user) {
                    const filtered = allOrders.filter(o =>
                        (o.user === userId) ||
                        (o.customerInfo?.phone === user.phone) ||
                        (o.customerInfo?.email === user.email)
                    );
                    setUserOrders(filtered);
                }
            } catch (e) {
                console.error("Fallback fetch failed", e);
                setUserOrders([]);
            }
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredUsers(users);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = users.filter(
                (user) =>
                    (user.username || "").toLowerCase().includes(lowerTerm) ||
                    (user.email || "").toLowerCase().includes(lowerTerm) ||
                    String(user.phone || "").includes(lowerTerm) ||
                    String(user._id || "").toLowerCase().includes(lowerTerm)
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    // Format User Orders based on orderSearchTerm
    const filteredUserOrders = userOrders.filter((order) => {
        if (!orderSearchTerm) return true;
        const lowTerm = orderSearchTerm.toLowerCase();
        return (
            (order.orderId || "").toLowerCase().includes(lowTerm) ||
            (order.orderStatus || "").toLowerCase().includes(lowTerm) ||
            String(order.totalAmount || "").includes(lowTerm)
        );
    });

    const handleUserClick = (user) => {
        setSelectedUser(user);
        fetchUserOrders(user._id);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // User Card Component
    const UserCard = ({ user }) => (
        <div
            onClick={() => handleUserClick(user)}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-black/30 transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-black font-bold text-lg shadow-inner">
                        {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                        <h3 className="font-bold text-black text-sm">{user.username || "Unknown User"}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#0e540b]/10 text-[#0e540b] uppercase tracking-wide">
                            {user.role || "Customer"}
                        </span>
                    </div>
                </div>

            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{user.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{user.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined: {formatDate(user.createdAt)}</span>
                </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    last login: <span className="text-black font-medium">{formatDate(user.lastLogin) || "Never"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-black mb-2">User Management</h1>
                    <p className="text-gray-600">Manage customers, view details and orders</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                        </div>
                        <p className="text-2xl font-black text-black">{users.length}</p>
                    </div>
                    {/* Add more stats if available, like 'Active Today' etc */}
                </div>

                {/* Search Bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e540b]/20 focus:border-[#0e540b] text-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map(user => (
                            <UserCard key={user._id} user={user} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-black">No users found</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
                    </div>
                )}

                {/* User Detail Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
                                        {selectedUser.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-black">{selectedUser.username}</h3>
                                        <p className="text-xs text-gray-500">ID: {selectedUser._id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left Column: Info */}
                                    <div className="md:col-span-1 space-y-6">
                                        <section>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h4>
                                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Mail className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500">Email Address</p>
                                                        <p className="text-sm font-medium text-black truncate">{selectedUser.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Phone className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500">Phone Number</p>
                                                        <p className="text-sm font-medium text-black">{selectedUser.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Calendar className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500">Joined Date</p>
                                                        <p className="text-sm font-medium text-black">{formatDate(selectedUser.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Clock className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500">Last Login</p>
                                                        <p className="text-sm font-medium text-black">{formatDate(selectedUser.lastLogin)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                                            <section>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Saved Addresses</h4>
                                                <div className="space-y-2">
                                                    {selectedUser.addresses.map((addr, idx) => (
                                                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <MapPin className="w-3.5 h-3.5 text-black" />
                                                                <span className="font-bold text-black">{addr.type || "Home"}</span>
                                                            </div>
                                                            <p className="text-gray-600 leading-relaxed">
                                                                {addr.street}, {addr.area}, {addr.city} - {addr.pincode}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    {/* Right Column: Orders */}
                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Orders</h4>
                                            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredUserOrders.length}</span>
                                        </div>

                                        <div className="mb-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search orders by ID, status, or amount..."
                                                    value={orderSearchTerm}
                                                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-xs transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                            {loadingOrders ? (
                                                <div className="flex justify-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-black"></div>
                                                </div>
                                            ) : filteredUserOrders.length > 0 ? (
                                                filteredUserOrders.map(order => (
                                                    <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-black/20 transition-all">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-gray-50 rounded-lg">
                                                                    <ShoppingBag className="w-4 h-4 text-black" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-black text-sm">#{order.orderId}</p>
                                                                    <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-black">₹{order.totalAmount}</p>
                                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.orderStatus === 'delivered' ? 'bg-[#0e540b]/10 text-[#0e540b]' :
                                                                        order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-500' :
                                                                            'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    {order.orderStatus}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {/* Items summary */}
                                                        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                                                            {order.selectedVegetables?.map(v => v.vegetable?.name).join(", ") ||
                                                                order.selectedBasket?.title ||
                                                                "Items details unavailable"}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-400 text-sm">No orders found for this user.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
