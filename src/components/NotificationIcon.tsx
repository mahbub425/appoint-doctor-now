import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
	id: string;
	type: string;
	title: string;
	message: string;
	is_read: boolean;
	metadata?: any;
	created_at: string;
	user_id?: string;
	doctor_id?: string;
	admin_id?: string;
}

interface NotificationIconProps {
	userType: 'user' | 'doctor' | 'admin';
	userId?: string;
}

export const NotificationIcon = ({
	userType,
	userId,
}: NotificationIconProps) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const { userProfile, doctorProfile } = useAuth();

	const fetchNotifications = async () => {
		try {
			let query = supabase
				.from('notifications')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(20);

			if (userType === 'user' && userProfile?.id) {
				query = query.eq('user_id', userProfile.id);
			} else if (userType === 'doctor' && doctorProfile?.id) {
				query = query.eq('doctor_id', doctorProfile.id);
			} else if (userType === 'admin') {
				query = query.eq('admin_id', '00000000-0000-0000-0000-000000000000');
			}

			const { data, error } = await query;

			if (error) {
				console.error('Error fetching notifications:', error);
				return;
			}

			setNotifications(data || []);
			setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	};

	const markAsRead = async (notificationId: string) => {
		try {
			const { error } = await supabase
				.from('notifications')
				.update({ is_read: true })
				.eq('id', notificationId);

			if (!error) {
				setNotifications((prev) =>
					prev.map((n) =>
						n.id === notificationId ? { ...n, is_read: true } : n,
					),
				);
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	};

	const markAllAsRead = async () => {
		try {
			let query = supabase.from('notifications').update({ is_read: true });

			if (userType === 'user' && userProfile?.id) {
				query = query.eq('user_id', userProfile.id);
			} else if (userType === 'doctor' && doctorProfile?.id) {
				query = query.eq('doctor_id', doctorProfile.id);
			} else if (userType === 'admin') {
				query = query.eq('admin_id', '00000000-0000-0000-0000-000000000000');
			}

			const { error } = await query;

			if (!error) {
				setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
				setUnreadCount(0);
			}
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	};

	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60),
		);

		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	useEffect(() => {
		fetchNotifications();

		// Set up real-time subscription for new notifications
		const channel = supabase
			.channel('notifications_changes')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'notifications',
				},
				(payload) => {
					const newNotification = payload.new as Notification;

					// Check if this notification is for the current user
					const isForCurrentUser =
						(userType === 'user' &&
							newNotification.user_id === userProfile?.id) ||
						(userType === 'doctor' &&
							newNotification.doctor_id === doctorProfile?.id) ||
						(userType === 'admin' &&
							newNotification.admin_id ===
								'00000000-0000-0000-0000-000000000000');

					if (isForCurrentUser) {
						setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
						setUnreadCount((prev) => prev + 1);
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userType, userProfile?.id, doctorProfile?.id]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="secondary"
					size="sm"
					className="relative rounded-full size-10"
				>
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" side="bottom" align="end">
				<div className="flex items-center justify-between p-4 border-b">
					<h3 className="font-semibold">Notifications</h3>
					{unreadCount > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={markAllAsRead}
							className="text-xs"
						>
							Mark all read
						</Button>
					)}
				</div>
				<ScrollArea className="h-96">
					{notifications.length === 0 ? (
						<div className="p-4 text-center text-muted-foreground">
							No notifications yet
						</div>
					) : (
						<div className="space-y-1">
							{notifications.map((notification) => (
								<Card
									key={notification.id}
									className={`border-0 rounded-none shadow-none cursor-pointer hover:bg-muted/50 ${
										!notification.is_read ? 'bg-muted/30' : ''
									}`}
									onClick={() =>
										!notification.is_read && markAsRead(notification.id)
									}
								>
									<CardContent className="p-3">
										<div className="flex items-start gap-2">
											<div className="flex-1 space-y-1">
												<div className="flex items-center justify-between">
													<p className="text-sm font-medium">
														{notification.title}
													</p>
													{!notification.is_read && (
														<div className="h-2 w-2 bg-primary rounded-full" />
													)}
												</div>
												<p className="text-xs text-muted-foreground">
													{notification.message}
												</p>
												<p className="text-xs text-muted-foreground">
													{formatTimeAgo(notification.created_at)}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
};
