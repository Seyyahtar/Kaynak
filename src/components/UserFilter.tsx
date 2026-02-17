import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/userService';
import { User as UserType } from '@/types';

// Pastel renk paleti (kullanıcılara atamak için)
const PASTEL_COLORS = [
    'bg-red-100 text-red-800 border-red-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-lime-100 text-lime-800 border-lime-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-sky-100 text-sky-800 border-sky-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-violet-100 text-violet-800 border-violet-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-rose-100 text-rose-800 border-rose-200',
];

interface UserFilterProps {
    selectedUserIds: Set<string>;
    onSelectionChange: (selectedIds: Set<string>) => void;
    userColors: Map<string, string>;
    onColorMapChange: (map: Map<string, string>) => void;
    currentUserRole?: string;
}

export function UserFilter({
    selectedUserIds,
    onSelectionChange,
    userColors,
    onColorMapChange,
    currentUserRole,
}: UserFilterProps) {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial check for visibility
    const canViewFilter = ['ADMIN', 'YONETICI', 'DEPO'].includes(currentUserRole || '');

    useEffect(() => {
        if (canViewFilter) {
            loadUsers();
        }
    }, [canViewFilter, currentUserRole]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const allUsers = await userService.getAllUsers();
            const filteredUsers = allUsers; // Show all users including ADMIN
            setUsers(filteredUsers);

            // Renk ataması yap
            const newColorMap = new Map(userColors);
            let colorIndex = 0;

            filteredUsers.forEach(user => {
                if (!newColorMap.has(user.id)) {
                    newColorMap.set(user.id, PASTEL_COLORS[colorIndex % PASTEL_COLORS.length]);
                    colorIndex++;
                }
            });

            if (!newColorMap.has('Unknown')) {
                newColorMap.set('Unknown', 'bg-gray-100 text-gray-800 border-gray-200');
            }

            onColorMapChange(newColorMap);
        } catch (error) {
            console.error('Kullanıcılar yüklenemedi', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        onSelectionChange(newSelected);
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectionChange(new Set());
    };

    if (!canViewFilter) return null;

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center justify-between w-[280px] h-9 px-3 py-2 text-sm font-medium rounded-md border bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-900 transition-colors"
            >
                <div className="flex items-center truncate">
                    <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    {selectedUserIds.size === 0
                        ? "Kullanıcı Seç (Hepsi)"
                        : `${selectedUserIds.size} kullanıcı seçildi`}
                </div>
                <div className="flex items-center">
                    {selectedUserIds.size > 0 && (
                        <div
                            role="button"
                            className="mr-2 hover:bg-yellow-200 rounded-full p-1"
                            onClick={clearSelection}
                        >
                            <X className="h-3 w-3 text-yellow-700" />
                        </div>
                    )}
                    <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
                </div>
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-full mt-1 w-[280px] z-[9999] bg-white rounded-md border shadow-lg">
                    {/* Search Input */}
                    <div className="flex items-center gap-2 border-b px-3 h-9">
                        <Search className="h-4 w-4 shrink-0 opacity-50" />
                        <input
                            type="text"
                            placeholder="Kullanıcı ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                            autoFocus
                        />
                    </div>

                    {/* User List */}
                    <div className="max-h-64 overflow-auto p-1">
                        {filteredUsers.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500">
                                Kullanıcı bulunamadı.
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-gray-100"
                                >
                                    <div
                                        className={cn(
                                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0",
                                            selectedUserIds.has(user.id)
                                                ? "bg-blue-600 text-white"
                                                : "opacity-50"
                                        )}
                                    >
                                        {selectedUserIds.has(user.id) && (
                                            <Check className="h-3 w-3" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className={cn("w-3 h-3 rounded-full shrink-0", userColors.get(user.id)?.split(' ')[0] || 'bg-gray-200')}></span>
                                        <span className="truncate">{user.fullName}</span>
                                    </div>
                                    {user.role !== 'KULLANICI' && (
                                        <Badge variant="outline" className="ml-auto text-[10px] h-5 shrink-0">
                                            {user.role}
                                        </Badge>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
