"use client"
import React, { useEffect, useState } from 'react'
import { FaMusic } from 'react-icons/fa';
import DashboardPanelCard from '@/components/DashboardPanelCard';
import axios from 'axios';

export default function MusicCard() {
  const [musics, setMusics] = useState([]);
  const [isLoading, setLoading] = useState(false)

  const fetchMusicsData = () =>{
    setLoading(true);

   axios.get('/api/musics')
   .then(res =>{
    setMusics(res.data.musics);
    setLoading(false);
  })
  .catch(() => {
    setLoading(false);
   })
  }

  useEffect(() =>{
    fetchMusicsData();
  },[])

  return (
    <>
      <DashboardPanelCard
      isLoading={isLoading}
      color="#ff3333"
      title="Musics"
      counter={musics? musics.length:0}
      href="/admin/music" icon={ < FaMusic/>} />
    </>
  )
}