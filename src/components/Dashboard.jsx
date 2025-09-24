import React, { useState } from 'react';
import AddVegetableForm from './AddVegetableForm';
import OfferPanel from './OfferPanel';
import OrderTable from './OrderTable';
import VegetableTable from './VegetableTable';
import AddCityForm from './AddCityForm';

const Dashboard = () => {
    const [activeRoute, setActiveRoute] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigationItems = [
        { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
        { id: 'vegetables', name: 'Vegetables', icon: '🥕' },
        { id: 'orders', name: 'Orders', icon: '🛒' },
        { id: 'offers', name: 'Offers & Discounts', icon: '🏷️' },
        { id: 'AddCity', name: 'Add City', icon: '🌆' },
        { id: 'add-vegetable', name: 'Add Vegetable', icon: '➕' },
        
    ];

    const statisticsData = [
        {
            title: 'Total Stock Items',
            value: '24',
            icon: '📦',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Active Offers',
            value: '12',
            icon: '🏷️',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Low Stock Items',
            value: '3',
            icon: '⚠️',
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        },
        {
            title: 'Total Orders Today',
            value: '47',
            icon: '🛒',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            title: 'Total Orders',
            value: '47',
            icon: '🛒',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            title: 'Revenue Today',
            value: '₹2,340',
            icon: '💰',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        },
        // {
        //     title: 'Total Customers',
        //     value: '156',
        //     icon: '👥',
        //     color: 'text-indigo-600',
        //     bgColor: 'bg-indigo-50'
        // }
    ];

    const renderContent = () => {
        switch(activeRoute) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Welcome to the Vegbazar Admin Panel. Use the sidebar to navigate to different sections.</p>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                                    <p className="text-sm text-gray-600 mt-2">5 new orders in the last hour</p>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                                    <p className="text-sm text-gray-600 mt-2">Add new vegetables or manage stock</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'vegetables':
                return (
                    <VegetableTable/>
                );
            case 'stock':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Stock Management</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Monitor and update stock levels.</p>
                        </div>
                    </div>
                );
            case 'orders':
                return (
                      <OrderTable/>
                );
            case 'offers':
                return (
                   <OfferPanel/>
                );
            case 'AddCity':
                return (
                  <AddCityForm/>
                );
            case 'add-vegetable':
                return (
                    <AddVegetableForm/>
                );
            case 'settings':
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Configure your application settings.</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Select a menu item from the sidebar.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 flex z-40 md:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="text-white text-xl">×</span>
                            </button>
                        </div>
                        {/* Mobile Navigation */}
                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex-shrink-0 flex items-center px-4">
                                <h1 className="text-xl font-bold text-gray-900">Vegbazar</h1>
                            </div>
                            <nav className="mt-5 px-2 space-y-1">
                                {navigationItems.map((item) => {
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveRoute(item.id);
                                                setSidebarOpen(false);
                                            }}
                                            className={`${
                                                activeRoute === item.id
                                                    ? 'bg-green-100 text-green-900'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left`}
                                        >
                                            <span className="mr-4 text-xl">
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col h-0 flex-1 bg-white shadow">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-4">
                                <h1 className="text-xl font-bold text-gray-900">Vegbazar</h1>
                            </div>
                            <nav className="mt-8 flex-1 px-2 space-y-1">
                                {navigationItems.map((item) => {
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveRoute(item.id)}
                                            className={`${
                                                activeRoute === item.id
                                                    ? 'bg-green-100 text-green-900'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-150`}
                                        >
                                            <span className="mr-3 text-lg">
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                {/* Top header with mobile menu button */}
                <div className="md:hidden">
                    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
                        <button
                            type="button"
                            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="text-xl">☰</span>
                        </button>
                        <div className="flex-1 px-4 flex justify-between">
                            <div className="flex-1 flex">
                                <div className="w-full flex md:ml-0">
                                    <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                                        <div className="flex items-center h-16">
                                            <h1 className="text-xl font-bold text-gray-900">Vegbazar Admin</h1>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <div className="flex">
                        {/* Content Area */}
                        <div className="flex-1 p-6">
                            {renderContent()}
                        </div>

                        {/* Right Statistics Panel */}
                        <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistics</h3>
                            
                            <div className="space-y-4">
                                {statisticsData.map((stat, index) => {
                                    return (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-150">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                                                    <span className="text-2xl">{stat.icon}</span>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                                        {stat.title}
                                                    </dt>
                                                    <dd className="mt-1">
                                                        <div className="text-2xl font-semibold text-gray-900">
                                                            {stat.value}
                                                        </div>
                                                    </dd>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick Actions Section */}
                            <div className="mt-8">
                                <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Actions</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setActiveRoute('add-vegetable')}
                                        className="w-full text-left p-3 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-150"
                                    >
                                        + Add New Vegetable
                                    </button>
                                    <button
                                        onClick={() => setActiveRoute('offers')}
                                        className="w-full text-left p-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-150"
                                    >
                                        + Create New Offer
                                    </button>
                                    <button
                                        onClick={() => setActiveRoute('stock')}
                                        className="w-full text-left p-3 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors duration-150"
                                    >
                                        📊 Update Stock Levels
                                    </button>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="mt-8">
                                <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Activity</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                                        <span className="text-gray-600">New order #1234 received</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                                        <span className="text-gray-600">Tomato stock updated</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                                        <span className="text-gray-600">New customer registered</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                                        <span className="text-gray-600">Onion stock running low</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;