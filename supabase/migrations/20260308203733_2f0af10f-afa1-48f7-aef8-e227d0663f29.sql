
-- Fix ALL RLS policies: change from RESTRICTIVE to PERMISSIVE
-- The issue is that restrictive policies without any permissive policy deny everything

-- ====== admin_requests ======
DROP POLICY IF EXISTS "Users can insert own admin requests" ON public.admin_requests;
CREATE POLICY "Users can insert own admin requests" ON public.admin_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own admin requests" ON public.admin_requests;
CREATE POLICY "Users can view own admin requests" ON public.admin_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all admin requests" ON public.admin_requests;
CREATE POLICY "Admins can view all admin requests" ON public.admin_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update admin requests" ON public.admin_requests;
CREATE POLICY "Admins can update admin requests" ON public.admin_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete admin requests" ON public.admin_requests;
CREATE POLICY "Admins can delete admin requests" ON public.admin_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== push_subscriptions ======
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ====== notifications ======
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ====== profiles ======
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== produtos ======
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.produtos;
CREATE POLICY "Authenticated users can view products" ON public.produtos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can insert products" ON public.produtos;
CREATE POLICY "Admins can insert products" ON public.produtos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update products" ON public.produtos;
CREATE POLICY "Admins can update products" ON public.produtos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete products" ON public.produtos;
CREATE POLICY "Admins can delete products" ON public.produtos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== purchase_history ======
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchase_history;
CREATE POLICY "Users can view their own purchases" ON public.purchase_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchase_history;
CREATE POLICY "Users can insert their own purchases" ON public.purchase_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchase_history;
CREATE POLICY "Admins can view all purchases" ON public.purchase_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== partner_requests ======
DROP POLICY IF EXISTS "Users can insert own partner requests" ON public.partner_requests;
CREATE POLICY "Users can insert own partner requests" ON public.partner_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own partner requests" ON public.partner_requests;
CREATE POLICY "Users can view own partner requests" ON public.partner_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all partner requests" ON public.partner_requests;
CREATE POLICY "Admins can view all partner requests" ON public.partner_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update partner requests" ON public.partner_requests;
CREATE POLICY "Admins can update partner requests" ON public.partner_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete partner requests" ON public.partner_requests;
CREATE POLICY "Admins can delete partner requests" ON public.partner_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== partner_profiles ======
DROP POLICY IF EXISTS "Users can insert own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can insert own partner profile" ON public.partner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can view own partner profile" ON public.partner_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own partner profile" ON public.partner_profiles;
CREATE POLICY "Users can update own partner profile" ON public.partner_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== support_tickets ======
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== cashback_points ======
DROP POLICY IF EXISTS "Authenticated users can view ranking" ON public.cashback_points;
CREATE POLICY "Authenticated users can view ranking" ON public.cashback_points FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own points" ON public.cashback_points;
CREATE POLICY "Users can insert their own points" ON public.cashback_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own points" ON public.cashback_points;
CREATE POLICY "Users can update their own points" ON public.cashback_points FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== farm_points_monthly ======
DROP POLICY IF EXISTS "Anyone authenticated can view monthly ranking" ON public.farm_points_monthly;
CREATE POLICY "Anyone authenticated can view monthly ranking" ON public.farm_points_monthly FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own monthly points" ON public.farm_points_monthly;
CREATE POLICY "Users can insert own monthly points" ON public.farm_points_monthly FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own monthly points" ON public.farm_points_monthly;
CREATE POLICY "Users can update own monthly points" ON public.farm_points_monthly FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== referrals ======
DROP POLICY IF EXISTS "Users can insert own referrals" ON public.referrals;
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;
CREATE POLICY "Users can update own referrals" ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = referrer_id);

-- ====== category_multipliers ======
DROP POLICY IF EXISTS "Anyone authenticated can view multipliers" ON public.category_multipliers;
CREATE POLICY "Anyone authenticated can view multipliers" ON public.category_multipliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage multipliers" ON public.category_multipliers;
CREATE POLICY "Admins can manage multipliers" ON public.category_multipliers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== special_events ======
DROP POLICY IF EXISTS "Anyone authenticated can view active events" ON public.special_events;
CREATE POLICY "Anyone authenticated can view active events" ON public.special_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage events" ON public.special_events;
CREATE POLICY "Admins can manage events" ON public.special_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== weekly_missions ======
DROP POLICY IF EXISTS "Anyone authenticated can view active missions" ON public.weekly_missions;
CREATE POLICY "Anyone authenticated can view active missions" ON public.weekly_missions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage missions" ON public.weekly_missions;
CREATE POLICY "Admins can manage missions" ON public.weekly_missions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ====== user_mission_progress ======
DROP POLICY IF EXISTS "Users can insert own mission progress" ON public.user_mission_progress;
CREATE POLICY "Users can insert own mission progress" ON public.user_mission_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own mission progress" ON public.user_mission_progress;
CREATE POLICY "Users can view own mission progress" ON public.user_mission_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mission progress" ON public.user_mission_progress;
CREATE POLICY "Users can update own mission progress" ON public.user_mission_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ====== user_roles ======
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ====== user_subscriptions ======
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
