"use client"
import React, { useEffect, useState } from 'react'
import { FaUsers } from 'react-icons/fa';
import DashboardPanelCard from '@/components/DashboardPanelCard';
import axios from 'axios';

export default function UserCard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setLoading] = useState(false)

  const fetchUsersData = () =>{
    setLoading(true);

   axios.get('/api/users')
   .then(res =>{
    setUsers(res.data.users);
    setLoading(false);
  })
  .catch(() => {
    setLoading(false);
   })
  }

  useEffect(() =>{
    fetchUsersData();
  },[])

  return (
    <>
      <DashboardPanelCard
      isLoading={isLoading}
      color="#235964"
      title="Users"
      counter={users?users.length:0}
      href="/admin/user" icon={ <FaUsers />} />
    </>
  )
}