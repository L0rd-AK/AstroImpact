import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SimulationContext = createContext();

export { SimulationContext };

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export const SimulationProvider = ({ children }) => {
  const [simulations, setSimulations] = useState([]);
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [asteroids, setAsteroids] = useState([]);

  const fetchAsteroids = async (params = {}) => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/api/asteroids?${queryString}`);
      setAsteroids(response.data.asteroids);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch asteroids:', error);
      toast.error('Failed to load asteroids');
      return { asteroids: [] };
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedAsteroids = async (limit = 10) => {
    try {
      const response = await api.get(`/api/asteroids/featured?limit=${limit}`);
      return response.data.asteroids;
    } catch (error) {
      console.error('Failed to fetch featured asteroids:', error);
      return [];
    }
  };

  const searchAsteroids = async (query, limit = 10) => {
    try {
      const response = await api.get(`/api/asteroids/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.asteroids;
    } catch (error) {
      console.error('Failed to search asteroids:', error);
      return [];
    }
  };

  const getAsteroidById = async (id) => {
    try {
      const response = await api.get(`/api/asteroids/${id}`);
      return response.data.asteroid;
    } catch (error) {
      console.error('Failed to fetch asteroid:', error);
      throw error;
    }
  };

  const runSimulation = async (simulationData) => {
    try {
      setLoading(true);
      const response = await api.post('/api/simulations', simulationData);
      const newSimulation = response.data.simulation;
      
      setCurrentSimulation(newSimulation);
      
      toast.success('Simulation completed successfully!');
      return { success: true, simulation: newSimulation };
    } catch (error) {
      const message = error.response?.data?.error || 'Simulation failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSimulations = async (params = {}) => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/api/simulations/my?${queryString}`);
      setSimulations(response.data.simulations);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user simulations:', error);
      toast.error('Failed to load your simulations');
      return { simulations: [] };
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicSimulations = async (params = {}) => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/api/simulations/public?${queryString}`);
      setSimulations(response.data.simulations);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch public simulations:', error);
      toast.error('Failed to load community simulations');
      return { simulations: [] };
    } finally {
      setLoading(false);
    }
  };

  const getSimulationById = async (id) => {
    try {
      const response = await api.get(`/api/simulations/${id}`);
      return response.data.simulation;
    } catch (error) {
      console.error('Failed to fetch simulation:', error);
      throw error;
    }
  };

  const voteOnSimulation = async (simulationId, vote) => {
    try {
      const response = await api.post(`/api/simulations/${simulationId}/vote`, { vote });
      
      toast.success('Vote recorded!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to vote';
      toast.error(message);
      throw error;
    }
  };

  const addComment = async (simulationId, text) => {
    try {
      const response = await api.post(`/api/simulations/${simulationId}/comments`, { text });
      toast.success('Comment added!');
      return response.data.comment;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add comment';
      toast.error(message);
      throw error;
    }
  };

  const deleteSimulation = async (simulationId) => {
    try {
      await api.delete(`/api/simulations/${simulationId}`);
      setSimulations(prev => prev.filter(sim => sim._id !== simulationId));
      toast.success('Simulation deleted');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete simulation';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const getSimulationStats = async () => {
    try {
      const response = await api.get('/api/simulations/stats/overview');
      return response.data.statistics;
    } catch (error) {
      console.error('Failed to fetch simulation stats:', error);
      return {};
    }
  };

  const getAsteroidStats = async () => {
    try {
      const response = await api.get('/api/asteroids/stats/overview');
      return response.data.statistics;
    } catch (error) {
      console.error('Failed to fetch asteroid stats:', error);
      return {};
    }
  };

  const syncAsteroidData = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/asteroids/sync');
      toast.success('Asteroid data synchronized!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to sync data';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    simulations,
    currentSimulation,
    loading,
    asteroids,
    
    // Asteroid methods
    fetchAsteroids,
    fetchFeaturedAsteroids,
    searchAsteroids,
    getAsteroidById,
    syncAsteroidData,
    getAsteroidStats,
    
    // Simulation methods
    runSimulation,
    fetchUserSimulations,
    fetchPublicSimulations,
    getSimulationById,
    voteOnSimulation,
    addComment,
    deleteSimulation,
    getSimulationStats,
    
    // State setters
    setCurrentSimulation,
    setSimulations
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};
