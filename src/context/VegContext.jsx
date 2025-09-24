import React, { createContext, useState, useEffect } from 'react';
export const VegContext = createContext();

export const VegProvider = ({ children }) => {
    const [vegetables, setVegetables] = useState([]);
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        const fetchVegetables = async () => {
            const data = await apiService.getVegetables();
            setVegetables(data);
        };

        const fetchOffers = async () => {
            const data = await apiService.getOffers();
            setOffers(data);
        };

        fetchVegetables();
        fetchOffers();
    }, []);

    const addVegetable = async (vegetable) => {
        const newVegetable = await apiService.addVegetable(vegetable);
        setVegetables([...vegetables, newVegetable]);
    };

    const updateOffer = async (offerId, updatedOffer) => {
        const updated = await apiService.updateOffer(offerId, updatedOffer);
        setOffers(offers.map(offer => (offer.id === offerId ? updated : offer)));
    };

    return (
        <VegContext.Provider value={{ vegetables, offers, addVegetable, updateOffer }}>
            {children}
        </VegContext.Provider>
    );
};