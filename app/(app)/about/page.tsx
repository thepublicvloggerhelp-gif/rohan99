'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Info, User, Star, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'

export default function AboutPage() {
  const supabase = createClient()
  const [admins, setAdmins] = useState<Profile[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        // Fetch users who are approved and opted to be shown on about page
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('status', 'approved')
          .eq('show_on_about', true)
          .order('full_name', { ascending: true })

        if (error) throw error

        if (data) {
          const adminsList = data.filter(u => u.role === 'admin')
          const membersList = data.filter(u => u.role === 'student')
          setAdmins(adminsList)
          setMembers(membersList)
        }
      } catch (err) {
        console.error('Error fetching about page data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAboutData()
  }, [])

  return (
    <div className="overflow-y-auto scroll-area h-full p-6 bg-surface-3">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Large Visible Animated Logo at Top */}
        <div className="flex flex-col items-center justify-center mt-6 mb-10 text-center">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-brand-500/30 shadow-brand bg-[#111111] transition-all relative flex items-center justify-center p-1">
            <img 
              src="/logo.png" 
              alt="YPSdudes logo" 
              className="w-full h-full object-cover object-top scale-[1.15] animate-logo"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold gradient-text mt-4 tracking-tight">YPSdudes</h1>
          <p className="text-slate-400 text-sm max-w-md mt-2 leading-relaxed">
            The exclusive community for JEE & NEET aspirants at Yugantar Public School, Rajnandgaon.
          </p>
        </div>

        {loading ? (
          <div className="w-full space-y-8">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-slate-200 rounded shimmer" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 w-32 bg-slate-200 rounded shimmer" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-10">
            
            {/* Admin Details Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <Star className="w-4 h-4 text-yellow-400" /> Platform Administrators
              </h2>
              {admins.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No administrators listed yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admins.map(admin => (
                    <div key={admin.id} className="glass-card rounded-2xl p-5 flex gap-4 items-start border-yellow-500/30 bg-gradient-to-br from-yellow-500/[0.04] to-transparent shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center text-xl font-black text-yellow-600 border border-yellow-500/30">
                        {admin.avatar_url ? (
                          <Image src={admin.avatar_url} alt={admin.full_name} width={64} height={64} className="object-cover" />
                        ) : (
                          getInitials(admin.full_name)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-sm md:text-base truncate">{admin.full_name}</h3>
                          <span className="text-[10px] font-extrabold bg-yellow-100 border border-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">@{admin.username} · {admin.stream}</p>
                        <p className="text-xs text-slate-700 mt-2 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 min-h-[40px]">
                          {admin.bio ? admin.bio : "No bio added yet."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Members Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <GraduationCap className="w-4 h-4 text-brand-400" /> Featured Members
              </h2>
              {members.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-6">
                  No members are configured to be displayed here. Admins can select featured members in the admin panel.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {members.map(member => (
                    <div key={member.id} className="glass-card rounded-2xl p-5 flex flex-col items-center text-center border-slate-200 bg-gradient-to-b from-slate-50 to-transparent hover:border-brand-500/30 hover:shadow-md transition-all duration-300">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center text-lg font-extrabold text-brand-600 border border-slate-200 mb-3">
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt={member.full_name} width={56} height={56} className="object-cover" />
                        ) : (
                          getInitials(member.full_name)
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm truncate w-full">{member.full_name}</h3>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">@{member.username}</p>
                      
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-2 border ${
                        member.stream === 'JEE' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {member.stream} Aspirant
                      </span>

                      <p className="text-[11px] text-slate-700 mt-3 leading-relaxed italic bg-slate-50 p-2 rounded-xl border border-slate-200/60 w-full min-h-[44px] flex items-center justify-center">
                        {member.bio ? `"${member.bio}"` : "Studying hard!"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            
          </div>
        )}
      </div>
    </div>
  )
}
