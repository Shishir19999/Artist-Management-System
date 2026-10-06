"use client";
import React, { useEffect, useState } from 'react';
import { FaGuitar } from 'react-icons/fa';
import DashboardPanelCard from '@/components/DashboardPanelCard';
import axios from 'axios';

export default function ArtistCard() {
  const [artists, setArtists] = useState([]); 
  const [isLoading, setLoading] = useState(false);

  const fetchArtistData = async () => {
    setLoading(true);
      
      axios.get('/api/artists')
      .then(res=>{
        setArtists(res.data.artists);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
       })
  };

  useEffect(() => {
    fetchArtistData();
  }, []);

  return (
    <>
      <DashboardPanelCard
        isLoading={isLoading}
        color="#ff9933"
        title="Artists"
        counter={artists ? artists.length : 0} 
        href="/admin/artist" icon={<FaGuitar />}
      />
    </>
  );
}
