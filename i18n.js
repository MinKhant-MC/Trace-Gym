(function () {
  'use strict';

  var STORAGE_KEY = 'gym_language';
  var DICTIONARIES = {
    en: {
      page_title: {
        login: 'Trace Gym',
        register: 'Trace Gym Registration',
        member: 'Trace Gym Member Dashboard',
        admin: 'Trace Gym Admin Dashboard'
      },
      common: {
        brand: 'Trace Gym',
        back_to_login: 'Back to Login',
        logout: 'Logout',
        close: 'Close',
        save: 'Save',
        search: 'Search',
        register_another: 'Register Another',
        open_registration: 'Open Registration',
        start_scanner: 'Start Scanner',
        stop_scanner: 'Stop Scanner'
      },
      login: {
        title: 'Trace Gym Membership System',
        subtitle: 'A clean gym platform for registration, attendance, workouts, and membership tracking.',
        member_role: 'Member Login',
        admin_role: 'Admin Login',
        identifier_label: 'Phone / Username',
        password_label: 'Password',
        button: 'Login',
        register_link: 'New Member Registration',
        placeholder_member_identifier: '09xxxxxxxxx',
        placeholder_admin_identifier: 'Admin username',
        placeholder_member_password: 'Member password',
        placeholder_admin_password: 'Admin password',
        fill_fields: 'Fill in both login fields.',
        signing_in: 'Signing in...',
        downloading_data: 'Downloading your dashboard to this device...',
        success: 'Login successful.',
        failed: 'Login failed.'
      },
      register: {
        title: 'Member Registration',
        subtitle: 'Register new members and send them for admin approval before access is activated.',
        name: 'Name',
        phone: 'Phone',
        email_optional: 'Email (Optional)',
        nrc: 'NRC',
        password: 'Password',
        confirm_password: 'Confirm Password',
        password_mismatch: 'Passwords do not match.',
        gender: 'Gender',
        gender_select: 'Select',
        gender_male: 'Male',
        gender_female: 'Female',
        gender_other: 'Other',
        age: 'Age',
        weight: 'Weight',
        height: 'Height',
        start_date: 'Start Date',
        months: 'How Many Months',
        personal_trainer: 'Personal Trainer',
        trainer_no: 'No',
        trainer_yes: 'Yes',
        goal_note: 'Fitness Goal / Note',
        goal_placeholder: 'Weight loss, muscle gain, rehab, etc.',
        photo: 'Member Photo',
        choose_photo: 'Choose Photo',
        open_camera: 'Open Camera',
        take_photo: 'Take Photo',
        retake_photo: 'Retake',
        photo_placeholder: 'No photo selected yet',
        photo_required: 'Please add a member photo before submitting.',
        photo_ready: 'Photo is ready.',
        photo_failed: 'Could not capture the photo.',
        open_camera_first: 'Open the camera first.',
        camera_ready: 'Camera is ready. Take the photo when the frame looks good.',
        camera_failed: 'Could not open the camera.',
        camera_not_supported: 'This device does not support camera access in the browser.',
        info_note: 'Member login after approval: phone number + your password',
        submit: 'Submit Registration',
        submitting: 'Submitting registration...',
        success: 'Registration submitted for approval.',
        pending_notice: 'Status: pending admin approval.',
        failed: 'Registration failed.'
      },
      member: {
        sidebar_title: 'Member',
        sidebar_text: 'Scan gym entry QR, track workouts, BMI, and membership alerts.',
        hero_title: 'Member Dashboard',
        loading_details: 'Loading member details...',
        calories_today: 'Calories Burned Today',
        bmi: 'BMI',
        membership_days_left: 'Membership Days Left',
        trainer_plan: 'Trainer Plan',
        checkin_title: 'Gym Check-In',
        checkin_text: 'Scan the gym entry QR shown by admin to record your arrival automatically.',
        scan_gym_qr: 'Scan Gym QR',
        checkin_starting: 'Starting camera scanner...',
        checkin_ready: 'Scanner ready. Point your camera at the gym QR.',
        checking_in: 'Recording your arrival...',
        checkin_success: 'Arrival recorded successfully.',
        checkin_already: 'You have already checked in today.',
        checkin_invalid: 'This is not the gym entry QR code.',
        checkin_status_done: 'You are already checked in for today.',
        checkin_status_waiting: 'You have not checked in yet today.',
        camera_permission_denied: 'Camera permission was denied. Please allow camera access in the browser.',
        camera_permission_dismissed: 'Camera permission was dismissed. Please try again.',
        camera_not_supported: 'This device does not support camera access in the browser.',
        qr_title: 'Your QR Code',
        qr_text: 'Show this QR code at the gym entrance',
        notifications_title: 'Membership Notifications',
        notifications_text: 'Expiry and renewal reminders',
        workout_title: 'Workout Log',
        workout_text: 'Choose an activity and save today\'s workout.',
        activity: 'Gym Machine / Activity',
        body_part: 'Body Part',
        machine: 'Machine',
        duration: 'Duration (minutes)',
        weight_kg: 'Weight (kg)',
        reps: 'Reps',
        sets: 'Sets',
        speed_kmh: 'Speed (km/hr)',
        incline_percent: 'Incline %',
        time_minutes: 'Time (minutes)',
        note: 'Note',
        note_placeholder: 'Chest, shoulder, bicep, back, etc.',
        save_workout: 'Save Workout',
        today_title: 'Today\'s Activities',
        today_text: 'Your logged activities for today',
        weekly_calories_title: '7-Day Calories',
        weekly_calories_text: 'Calories burned during the last 7 days. Old workout logs are removed after 7 days.',
        weekly_total: '7-day total',
        weekly_activities_title: 'Last 7 Days Activities',
        weekly_activities_text: 'Your workout history kept on this dashboard for 7 days.',
        no_notifications: 'No membership alerts right now.',
        no_logs: 'No activities logged for today yet.',
        no_logs_7_days: 'No workouts logged in the last 7 days yet.',
        no_activities: 'No gym activities available yet.',
        activity_option: '{name}',
        notification_expiring_title: 'Membership expiring soon',
        notification_expiring_message: 'Your membership will expire in {days} day(s). Please renew soon.',
        notification_inactive_title: 'Membership not active',
        notification_inactive_message: 'Your account is not active yet. Please contact admin.',
        member_id: 'Member ID: {id}',
        status_active_until: 'Membership active until {date} | Status: {status}',
        cached_refreshing: 'Showing saved member data from this device. Refreshing live data...',
        cached_only: 'Using saved local dashboard data for today. Live sync failed.',
        dashboard_failed: 'Failed to load dashboard.',
        log_line: '{minutes} min | {calories} cal',
        saving_workout: 'Saving workout...',
        workout_saved: 'Workout saved.',
        workout_failed: 'Could not save workout.'
      },
      admin: {
        sidebar_title: 'Admin Panel',
        sidebar_text: 'Approve members, read member QR codes, and monitor membership status.',
        hero_title: 'Admin Dashboard',
        loading: 'Loading gym system...',
        total_members: 'Total Active Members',
        pending_count: 'Pending Approvals',
        present_today: 'Checked In Today',
        expiring_count: 'Expiring Soon',
        scanner_title: 'Member QR Check-In',
        scanner_text: 'Ask the member to show their QR code. This device reads it and records attendance.',
        notifications_title: 'System Notifications',
        notifications_text: 'Membership expiry alerts for admin',
        pending_title: 'Pending Registrations',
        pending_text: 'Approve members before they can enter the system',
        attendance_title: 'Today\'s Attendance',
        attendance_text: 'Members who checked in today',
        search_title: 'Search Members',
        search_text: 'Search by member name or phone number',
        search_placeholder: 'Search by name or phone',
        summary: 'Monitor members, approvals, attendance, and upcoming expiries.',
        no_alerts: 'No expiry alerts right now.',
        no_pending: 'No pending registrations.',
        no_attendance: 'Nobody has checked in today yet.',
        no_members: 'No members found.',
        all_members_title: 'All Members',
        all_members_text: 'All approved members in this gym.',
        approving_member: 'Approving member...',
        rejecting_member: 'Rejecting registration...',
        loading_gym_qr: 'Loading gym QR...',
        notification_expiring_title: 'Membership expiring soon',
        notification_expiring_message: '{name} expires in {days} day(s).',
        pending_line: '{phone} | {gender} | {months} month(s)',
        pending_meta: 'Start: {date} | Trainer: {trainer}',
        approve: 'Approve',
        reject: 'Reject',
        scan_time: 'Scan time: {time}',
        member_line: '{phone} | {gender} | {memberId}',
        member_ends: 'Ends: {date} | Days left: {days}',
        dashboard_failed: 'Failed to load admin dashboard.',
        recording_attendance: 'Recording attendance...',
        attendance_recorded: 'Attendance recorded.',
        scan_failed: 'QR scan failed.',
        scanner_unavailable: 'Scanner library not available.',
        scanner_starting: 'Starting camera scanner...',
        scanner_ready: 'Scanner ready. Point at the member QR code.',
        show_gym_qr: 'Show Gym QR',
        edit_member: 'Edit',
        edit_member_title: 'Edit Member',
        edit_member_text: 'Update member information and membership details.',
        member_status: 'Status',
        reset_password_to_nrc: 'Reset member password to NRC',
        saving_member: 'Saving member...',
        member_saved: 'Member information saved.',
        member_save_failed: 'Could not save member information.',
        gym_qr_title: 'Gym Entry QR',
        gym_qr_text: 'Open this QR on the admin device. Logged-in members can scan it from their dashboard to mark arrival automatically.',
        gym_qr_name: 'Trace Gym Entry QR',
        gym_qr_meta: 'Members scan this from their dashboard to check in.',
        no_gym_qr: 'Gym QR is not ready yet. Update and redeploy Apps Script, then refresh this page.',
        camera_failed: 'Could not access camera.',
        camera_permission_denied: 'Camera permission was denied. Please allow camera access in the browser.',
        camera_permission_dismissed: 'Camera permission was dismissed. Please try again.'
      },
      value: {
        pending: 'Pending',
        active: 'Active',
        inactive: 'Inactive',
        approved: 'Approved',
        rejected: 'Rejected',
        expired: 'Expired',
        yes: 'Yes',
        no: 'No',
        male: 'Male',
        female: 'Female',
        other: 'Other'
      }
    },
    my: {
      page_title: {
        login: 'Trace Gym',
        register: 'Trace Gym စာရင်းသွင်းခြင်း',
        member: 'Trace Gym အဖွဲ့ဝင် မျက်နှာစာ',
        admin: 'Trace Gym စီမံခန့်ခွဲမှု မျက်နှာစာ'
      },
      common: {
        brand: 'Trace Gym',
        back_to_login: 'ဝင်ရန်စာမျက်နှာသို့ ပြန်သွားရန်',
        logout: 'ထွက်ရန်',
        save: 'သိမ်းရန်',
        search: 'ရှာရန်',
        register_another: 'အဖွဲ့ဝင်အသစ် ထပ်တင်ရန်',
        open_registration: 'စာရင်းသွင်းစာမျက်နှာ ဖွင့်ရန်',
        start_scanner: 'QR ဖတ်မယ်',
        stop_scanner: 'ရပ်မယ်'
      },
      login: {
        title: 'Trace Gym အသင်းဝင်စနစ်',
        subtitle: 'အဖွဲ့ဝင်စာရင်းသွင်းတာ၊ ဝင်လာတာမှတ်တာ၊ လေ့ကျင့်ခန်းမှတ်တာနဲ့ သက်တမ်းကြည့်တာတွေကို တစ်နေရာတည်းမှာ သုံးနိုင်ပါတယ်။',
        member_role: 'အဖွဲ့ဝင် ဝင်ရန်',
        admin_role: 'စီမံခန့်ခွဲသူ ဝင်ရန်',
        identifier_label: 'ဖုန်း / အသုံးပြုသူအမည်',
        password_label: 'စကားဝှက်',
        button: 'ဝင်ရန်',
        register_link: 'အဖွဲ့ဝင်အသစ် စာရင်းသွင်းရန်',
        placeholder_member_identifier: '09xxxxxxxxx',
        placeholder_admin_identifier: 'စီမံခန့်ခွဲသူ အမည်',
        placeholder_member_password: 'အဖွဲ့ဝင် NRC',
        placeholder_admin_password: 'စီမံခန့်ခွဲသူ စကားဝှက်',
        fill_fields: 'ဝင်ရောက်ရန် အချက်အလက်နှစ်ခုလုံး ဖြည့်ပါ။',
        signing_in: 'ဝင်ရောက်နေပါတယ်...',
        success: 'ဝင်ရောက်မှု အောင်မြင်ပါတယ်။',
        failed: 'ဝင်ရောက်မှု မအောင်မြင်ပါ။'
      },
      register: {
        title: 'အဖွဲ့ဝင် စာရင်းသွင်းခြင်း',
        subtitle: 'အဖွဲ့ဝင်အသစ်တွေကို ဒီမှာစာရင်းသွင်းပြီး စီမံခန့်ခွဲသူ အတည်ပြုပြီးမှ စနစ်ထဲ ဝင်လို့ရပါမယ်။',
        name: 'အမည်',
        phone: 'ဖုန်းနံပါတ်',
        email_optional: 'အီးမေးလ် (မဖြည့်လည်းရ)',
        nrc: 'NRC',
        gender: 'လိင်',
        gender_select: 'ရွေးပါ',
        gender_male: 'ကျား',
        gender_female: 'မ',
        gender_other: 'အခြား',
        age: 'အသက်',
        weight: 'အလေးချိန် (kg)',
        height: 'အရပ် (cm)',
        start_date: 'စတင်မည့်ရက်',
        months: 'ကစားမည့် လအရေအတွက်',
        personal_trainer: 'ကိုယ်ပိုင် Trainer',
        trainer_no: 'မလိုပါ',
        trainer_yes: 'လိုပါတယ်',
        goal_note: 'ရည်မှန်းချက် / မှတ်ချက်',
        goal_placeholder: 'အလေးချိန်လျှော့ချင်တယ်၊ ကြွက်သားတိုးချင်တယ် စသဖြင့်',
        info_note: 'အတည်ပြုပြီးနောက် ဝင်ရောက်ရန် - ဖုန်းနံပါတ် + NRC',
        submit: 'စာရင်းသွင်းမယ်',
        submitting: 'စာရင်းသွင်းနေပါတယ်...',
        success: 'အတည်ပြုရန်အတွက် စာရင်းသွင်းပြီးပါပြီ။',
        failed: 'စာရင်းသွင်းမှု မအောင်မြင်ပါ။'
      },
      member: {
        sidebar_title: 'အဖွဲ့ဝင်',
        sidebar_text: 'QR ကုတ်၊ လေ့ကျင့်ခန်းမှတ်တမ်း၊ BMI နဲ့ သက်တမ်းသတိပေးချက်တွေကို ဒီမှာကြည့်လို့ရပါတယ်။',
        hero_title: 'အဖွဲ့ဝင် မျက်နှာစာ',
        loading_details: 'အဖွဲ့ဝင်အချက်အလက်တွေ တင်နေပါတယ်...',
        calories_today: 'ဒီနေ့ လောင်ကျွမ်းတဲ့ Calories',
        bmi: 'BMI',
        membership_days_left: 'ကျန်သက်တမ်းရက်',
        trainer_plan: 'Trainer အစီအစဉ်',
        qr_title: 'သင့် QR ကုတ်',
        qr_text: 'ဂျင်ဝင်ပေါက်မှာ ဒီ QR ကုတ်ကို ပြပေးပါ',
        notifications_title: 'သတိပေးချက်များ',
        notifications_text: 'သက်တမ်းကုန်ခါနီးတာတွေကို ဒီမှာပြပါမယ်',
        workout_title: 'လေ့ကျင့်ခန်း မှတ်တမ်း',
        workout_text: 'ဒီနေ့ လုပ်ထားတဲ့ လေ့ကျင့်ခန်းကို ရွေးပြီး သိမ်းပါ။',
        activity: 'လေ့ကျင့်ခန်းအမျိုးအစား',
        duration: 'ကြာချိန် (မိနစ်)',
        note: 'မှတ်ချက်',
        note_placeholder: 'အပြေးစက်၊ ယောဂ၊ အားကစားလေ့ကျင့်ခန်း စသဖြင့်',
        save_workout: 'လေ့ကျင့်ခန်း သိမ်းရန်',
        today_title: 'ဒီနေ့ လေ့ကျင့်ခန်းများ',
        today_text: 'ဒီနေ့ သင်မှတ်ထားတဲ့ လေ့ကျင့်ခန်းတွေ',
        no_notifications: 'အခုတော့ သတိပေးချက် မရှိသေးပါ။',
        no_logs: 'ဒီနေ့အတွက် လေ့ကျင့်ခန်းမှတ်တမ်း မရှိသေးပါ။',
        no_activities: 'လေ့ကျင့်ခန်းအမျိုးအစား မထည့်ရသေးပါ။',
        activity_option: '{name} - တစ်နာရီလျှင် {calories} calories',
        notification_expiring_title: 'သက်တမ်းကုန်ခါနီးနေပါတယ်',
        notification_expiring_message: 'သင့်အသင်းဝင်သက်တမ်း {days} ရက်အတွင်း ကုန်တော့မယ်။ အချိန်မီ သက်တမ်းတိုးပေးပါ။',
        notification_inactive_title: 'အကောင့် မလှုပ်ရှားသေးပါ',
        notification_inactive_message: 'သင့်အကောင့် မဖွင့်ရသေးပါ။ စီမံခန့်ခွဲသူကို ဆက်သွယ်ပါ။',
        member_id: 'အဖွဲ့ဝင်နံပါတ်: {id}',
        status_active_until: 'သက်တမ်းကုန်မယ့်နေ့ {date} | အခြေအနေ {status}',
        cached_refreshing: 'ဒီစက်မှာ သိမ်းထားတဲ့ အချက်အလက်ကို အရင်ပြထားပါတယ်။ အသစ်ကို ပြန်ယူနေပါတယ်...',
        cached_only: 'ဒီနေ့အတွက် ဒီစက်ထဲက အချက်အလက်ကိုပဲ ပြထားပါတယ်။ အင်တာနက် sync မအောင်မြင်ပါ။',
        dashboard_failed: 'အဖွဲ့ဝင်အချက်အလက် တင်မရပါ။',
        log_line: '{minutes} မိနစ် | {calories} calories',
        saving_workout: 'လေ့ကျင့်ခန်း သိမ်းနေပါတယ်...',
        workout_saved: 'လေ့ကျင့်ခန်း သိမ်းပြီးပါပြီ။',
        workout_failed: 'လေ့ကျင့်ခန်း သိမ်းမရပါ။'
      },
      admin: {
        sidebar_title: 'စီမံခန့်ခွဲမှု',
        sidebar_text: 'အဖွဲ့ဝင်တွေကို အတည်ပြုတာ၊ QR ဖတ်တာနဲ့ သက်တမ်းတွေကို ဒီကနေစီမံလို့ရပါတယ်။',
        hero_title: 'စီမံခန့်ခွဲမှု မျက်နှာစာ',
        loading: 'အချက်အလက်တွေ တင်နေပါတယ်...',
        total_members: 'လက်ရှိ အဖွဲ့ဝင်စုစုပေါင်း',
        pending_count: 'အတည်ပြုရန် ကျန်သူများ',
        present_today: 'ဒီနေ့ ဝင်ထားသူ',
        expiring_count: 'သက်တမ်းကုန်ခါနီးသူ',
        scanner_title: 'အဖွဲ့ဝင် QR ဖတ်ခြင်း',
        scanner_text: 'အဖွဲ့ဝင်က သူ့ QR ကုတ်ကို ပြပေးပါမယ်။ ဒီစက်က ဖတ်ပြီး ဝင်ရောက်မှု မှတ်တမ်းတင်ပေးပါမယ်။',
        notifications_title: 'သတိပေးချက်များ',
        notifications_text: 'သက်တမ်းကုန်ခါနီးသူတွေကို ဒီမှာပြပါမယ်',
        pending_title: 'စောင့်ဆိုင်းနေသော စာရင်းသွင်းမှုများ',
        pending_text: 'စနစ်ထဲ ဝင်ခွင့်ပေးခင် ဒီမှာ အတည်ပြုပေးပါ',
        attendance_title: 'ဒီနေ့ ဝင်ထားသူများ',
        attendance_text: 'ဒီနေ့ ဂျင်လာထားတဲ့ အဖွဲ့ဝင်တွေ',
        search_title: 'အဖွဲ့ဝင် ရှာရန်',
        search_text: 'အမည် ဒါမှမဟုတ် ဖုန်းနံပါတ်နဲ့ ရှာလို့ရပါတယ်',
        search_placeholder: 'အမည် သို့မဟုတ် ဖုန်းနံပါတ်နဲ့ ရှာရန်',
        summary: 'အဖွဲ့ဝင်အရေအတွက်၊ အတည်ပြုရန်ကျန်တာ၊ ဒီနေ့ ဝင်ထားသူနဲ့ သက်တမ်းကုန်ခါနီးသူတွေကို ဒီမှာကြည့်နိုင်ပါတယ်။',
        no_alerts: 'အခုတော့ သတိပေးချက် မရှိသေးပါ။',
        no_pending: 'အတည်ပြုရန် စာရင်း မရှိသေးပါ။',
        no_attendance: 'ဒီနေ့ ဝင်ထားသူ မရှိသေးပါ။',
        no_members: 'ကိုက်ညီတဲ့ အဖွဲ့ဝင် မတွေ့ပါ။',
        notification_expiring_title: 'သက်တမ်းကုန်ခါနီးသူ ရှိနေပါတယ်',
        notification_expiring_message: '{name} ရဲ့ သက်တမ်း {days} ရက်အတွင်း ကုန်တော့မယ်။',
        pending_line: '{phone} | {gender} | {months} လ',
        pending_meta: 'စတင်မယ့်ရက် {date} | Trainer {trainer}',
        approve: 'အတည်ပြုမယ်',
        reject: 'ပယ်ချမယ်',
        scan_time: 'ဖတ်ထားတဲ့အချိန် {time}',
        member_line: '{phone} | {gender} | {memberId}',
        member_ends: 'သက်တမ်းကုန်မယ့်နေ့ {date} | ကျန်ရက် {days}',
        dashboard_failed: 'စီမံခန့်ခွဲမှုအချက်အလက် တင်မရပါ။',
        recording_attendance: 'ဝင်ရောက်မှု မှတ်တမ်းတင်နေပါတယ်...',
        attendance_recorded: 'ဝင်ရောက်မှု မှတ်တမ်းတင်ပြီးပါပြီ။',
        scan_failed: 'QR ကုတ် ဖတ်မရပါ။',
        scanner_unavailable: 'QR ဖတ်စနစ် မရရှိနိုင်ပါ။',
        scanner_starting: 'ကင်မရာ ဖွင့်နေပါတယ်...',
        scanner_ready: 'အဆင်သင့်ဖြစ်ပါပြီ။ အဖွဲ့ဝင် QR ကုတ်ကို ကင်မရာရှေ့ပြပေးပါ။',
        camera_failed: 'ကင်မရာ ဖွင့်မရပါ။',
        camera_permission_denied: 'ကင်မရာအသုံးပြုခွင့် မရပါ။ Browser မှာ Allow လုပ်ပေးပါ။',
        camera_permission_dismissed: 'ကင်မရာခွင့်ပြုချက် မပေးရသေးပါ။ ထပ်စမ်းကြည့်ပါ။'
      },
      value: {
        pending: 'စောင့်ဆိုင်းနေသည်',
        active: 'အသုံးပြုနေသည်',
        inactive: 'မလှုပ်ရှားပါ',
        approved: 'အတည်ပြုပြီး',
        rejected: 'ပယ်ချပြီး',
        expired: 'သက်တမ်းကုန်ဆုံးပြီး',
        yes: 'လိုပါတယ်',
        no: 'မလိုပါ',
        male: 'ကျား',
        female: 'မ',
        other: 'အခြား'
      }
    }
  };

  DICTIONARIES.my.common.close = 'ပိတ်မယ်';
  DICTIONARIES.my.admin.show_member_qr = 'အဖွဲ့ဝင် QR ပြမယ်';
  DICTIONARIES.my.admin.select_qr_member = 'QR အတွက် ရွေးမယ်';
  DICTIONARIES.my.admin.select_member_first = 'အရင် အဖွဲ့ဝင်ကို ရှာပြီး ရွေးပေးပါ။';
  DICTIONARIES.my.admin.qr_member_selected = '{name} ကို QR ပြဖို့ ရွေးထားပါတယ်။';
  DICTIONARIES.my.admin.member_qr_title = 'အဖွဲ့ဝင် QR ကတ်';
  DICTIONARIES.my.admin.member_qr_text = 'လိုအပ်တဲ့အချိန် ဒီစက်ပေါ်မှာ အဖွဲ့ဝင် QR ကတ်ကို ဖွင့်ပြနိုင်ပါတယ်။';
  DICTIONARIES.my.admin.member_qr_missing = 'ဒီအဖွဲ့ဝင်အတွက် QR ကုတ် မရှိသေးပါ။';

  DICTIONARIES.my.register.photo = 'ဓာတ်ပုံ';
  DICTIONARIES.my.register.choose_photo = 'ဓာတ်ပုံရွေးမယ်';
  DICTIONARIES.my.register.open_camera = 'ကင်မရာဖွင့်မယ်';
  DICTIONARIES.my.register.take_photo = 'ဓာတ်ပုံရိုက်မယ်';
  DICTIONARIES.my.register.retake_photo = 'ပြန်ရိုက်မယ်';
  DICTIONARIES.my.register.photo_placeholder = 'ဓာတ်ပုံ မထည့်ရသေးပါ။';
  DICTIONARIES.my.register.photo_required = 'စာရင်းသွင်းမပို့ခင် ဓာတ်ပုံထည့်ပေးပါ။';
  DICTIONARIES.my.register.photo_ready = 'ဓာတ်ပုံ အဆင်သင့်ဖြစ်ပါပြီ။';
  DICTIONARIES.my.register.photo_failed = 'ဓာတ်ပုံ မရိုက်နိုင်ပါ။';
  DICTIONARIES.my.register.open_camera_first = 'အရင် ကင်မရာဖွင့်ပေးပါ။';
  DICTIONARIES.my.register.camera_ready = 'ကင်မရာ အဆင်သင့်ဖြစ်ပါပြီ။ ပုံကောင်းကောင်းရပြီဆို ရိုက်နိုင်ပါတယ်။';
  DICTIONARIES.my.register.camera_failed = 'ကင်မရာ မဖွင့်နိုင်ပါ။';
  DICTIONARIES.my.register.camera_not_supported = 'ဒီစက်ရဲ့ browser မှာ camera access မရနိုင်ပါ။';
  DICTIONARIES.my.member.checkin_title = 'ဝင်ရောက်မှတ်တမ်း';
  DICTIONARIES.my.member.checkin_text = 'Admin ဘက်ကပြထားတဲ့ gym QR ကို scan လုပ်ပြီး ဒီနေ့ရောက်ရှိမှုကို အလိုအလျောက်မှတ်တမ်းတင်ပါ။';
  DICTIONARIES.my.member.scan_gym_qr = 'Gym QR ကို Scan လုပ်မယ်';
  DICTIONARIES.my.member.checkin_starting = 'ကင်မရာ ဖွင့်နေပါတယ်...';
  DICTIONARIES.my.member.checkin_ready = 'Scan လုပ်ဖို့ အဆင်သင့်ဖြစ်ပါပြီ။ Gym QR ကို ကင်မရာရှေ့ပြပါ။';
  DICTIONARIES.my.member.checking_in = 'ရောက်ရှိမှု မှတ်တမ်းတင်နေပါတယ်...';
  DICTIONARIES.my.member.checkin_success = 'ဒီနေ့ ရောက်ရှိမှု မှတ်တမ်းတင်ပြီးပါပြီ။';
  DICTIONARIES.my.member.checkin_already = 'ဒီနေ့အတွက် ဝင်ရောက်မှတ်တမ်း တင်ပြီးသားပါ။';
  DICTIONARIES.my.member.checkin_invalid = 'ဒါက gym ဝင်ပေါက် QR မဟုတ်ပါ။';
  DICTIONARIES.my.member.checkin_status_done = 'ဒီနေ့အတွက် ဝင်ရောက်ပြီးသားပါ။';
  DICTIONARIES.my.member.checkin_status_waiting = 'ဒီနေ့အတွက် ဝင်ရောက်မှတ်တမ်း မတင်ရသေးပါ။';
  DICTIONARIES.my.member.camera_permission_denied = 'ကင်မရာအသုံးပြုခွင့် မရပါ။ Browser မှာ Allow လုပ်ပေးပါ။';
  DICTIONARIES.my.member.camera_permission_dismissed = 'ကင်မရာခွင့်ပြုချက် မပေးရသေးပါ။ ထပ်စမ်းကြည့်ပါ။';
  DICTIONARIES.my.member.camera_not_supported = 'ဒီစက်ရဲ့ browser မှာ camera access မရနိုင်ပါ။';
  DICTIONARIES.my.admin.show_gym_qr = 'Gym QR ပြမယ်';
  DICTIONARIES.my.admin.gym_qr_title = 'Gym ဝင်ပေါက် QR';
  DICTIONARIES.my.admin.gym_qr_text = 'ဒီ QR ကို admin စက်ပေါ်မှာပြထားပါ။ Login ဝင်ထားတဲ့ member က သူ့ dashboard ကနေ scan လုပ်ပြီး arrival ကို အလိုအလျောက်မှတ်တမ်းတင်နိုင်ပါတယ်။';
  DICTIONARIES.my.admin.gym_qr_name = 'Trace Gym ဝင်ပေါက် QR';
  DICTIONARIES.my.admin.gym_qr_meta = 'Member က သူ့ dashboard ကနေ scan လုပ်ပြီး check in ဝင်ပါမယ်။';
  DICTIONARIES.my.admin.no_gym_qr = 'Gym QR မရသေးပါ။';

  DICTIONARIES.my.register.pending_notice = 'အခြေအနေ - Admin အတည်ပြုရန် စောင့်ဆိုင်းနေပါသည်။';
  DICTIONARIES.my.admin.no_gym_qr = 'Gym QR မပေါ်သေးပါ။ Apps Script ကို update ပြီး deploy ပြန်လုပ်ပြီး page ကို refresh လုပ်ပါ။';
  DICTIONARIES.my.login.downloading_data = 'Dashboard အချက်အလက်တွေကို ဒီစက်ထဲ သိမ်းနေပါသည်...';
  DICTIONARIES.my.member.weekly_calories_title = '၇ ရက်စာ Calories';
  DICTIONARIES.my.member.weekly_calories_text = 'ပြီးခဲ့သော ၇ ရက်အတွင်း လောင်ကျွမ်းခဲ့သော calories ကို ပြထားပါသည်။ ၇ ရက်ကျော်သော workout မှတ်တမ်းများကို ဖျက်ပါမည်။';
  DICTIONARIES.my.member.weekly_total = '၇ ရက်စုစုပေါင်း';
  DICTIONARIES.my.member.weekly_activities_title = 'နောက်ဆုံး ၇ ရက်စာ လေ့ကျင့်ခန်းများ';
  DICTIONARIES.my.member.weekly_activities_text = 'ဒီ dashboard မှာ workout မှတ်တမ်းကို ၇ ရက်စာသာ သိမ်းထားပါသည်။';
  DICTIONARIES.my.member.no_logs_7_days = 'နောက်ဆုံး ၇ ရက်အတွင်း workout မှတ်တမ်း မရှိသေးပါ။';
  DICTIONARIES.my.admin.edit_member = 'ပြင်ရန်';
  DICTIONARIES.my.admin.edit_member_title = 'Member အချက်အလက် ပြင်ရန်';
  DICTIONARIES.my.admin.edit_member_text = 'Member အချက်အလက်နှင့် သက်တမ်းအချက်အလက်များကို ပြင်နိုင်ပါသည်။';
  DICTIONARIES.my.admin.member_status = 'အခြေအနေ';
  DICTIONARIES.my.admin.reset_password_to_nrc = 'Member password ကို NRC ပြန်ထားမည်';
  DICTIONARIES.my.admin.saving_member = 'Member အချက်အလက် သိမ်းနေပါသည်...';
  DICTIONARIES.my.admin.member_saved = 'Member အချက်အလက် သိမ်းပြီးပါပြီ။';
  DICTIONARIES.my.admin.member_save_failed = 'Member အချက်အလက် မသိမ်းနိုင်ပါ။';
  DICTIONARIES.my.login.placeholder_member_password = 'အဖွဲ့ဝင် စကားဝှက်';
  DICTIONARIES.my.register.password = 'စကားဝှက်';
  DICTIONARIES.my.register.confirm_password = 'စကားဝှက် ထပ်ထည့်ရန်';
  DICTIONARIES.my.register.password_mismatch = 'စကားဝှက်နှစ်ခု မတူပါ။';
  DICTIONARIES.my.register.info_note = 'အတည်ပြုပြီးနောက် ဝင်ရန် - ဖုန်းနံပါတ် + သင်ထည့်ထားသော စကားဝှက်';
  DICTIONARIES.my.admin.all_members_title = 'အဖွဲ့ဝင်အားလုံး';
  DICTIONARIES.my.admin.all_members_text = 'ဒီ Gym ထဲရှိ အတည်ပြုပြီးသား အဖွဲ့ဝင်အားလုံး။';
  DICTIONARIES.my.admin.approving_member = 'အဖွဲ့ဝင် အတည်ပြုနေပါသည်...';
  DICTIONARIES.my.admin.rejecting_member = 'စာရင်းသွင်းမှု ပယ်ချနေပါသည်...';
  DICTIONARIES.my.admin.loading_gym_qr = 'Gym QR ကို ဖွင့်နေပါသည်...';

  DICTIONARIES.my.member.activity = 'လေ့ကျင့်မည့် စက် / လေ့ကျင့်ခန်း';
  DICTIONARIES.my.member.body_part = 'လေ့ကျင့်မည့် အပိုင်း';
  DICTIONARIES.my.member.machine = 'စက်အမျိုးအစား';
  DICTIONARIES.my.member.weight_kg = 'အလေးချိန် (kg)';
  DICTIONARIES.my.member.reps = 'အကြိမ်ရေ';
  DICTIONARIES.my.member.sets = 'အကျော့';
  DICTIONARIES.my.member.speed_kmh = 'အမြန်နှုန်း (km/hr)';
  DICTIONARIES.my.member.incline_percent = 'စောင်းနှုန်း %';
  DICTIONARIES.my.member.time_minutes = 'ကြာချိန် (မိနစ်)';
  DICTIONARIES.my.member.note_placeholder = 'Chest, shoulder, bicep, back စသဖြင့်';

  function readValue(source, key) {
    return key.split('.').reduce(function (result, part) {
      return result && Object.prototype.hasOwnProperty.call(result, part) ? result[part] : undefined;
    }, source);
  }

  function interpolate(template, params) {
    return String(template).replace(/\{(\w+)\}/g, function (match, key) {
      return params && Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
  }

  function getLanguage() {
    var saved;

    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      saved = '';
    }

    return saved && DICTIONARIES[saved] ? saved : 'en';
  }

  function getLocale() {
    return getLanguage() === 'my' ? 'my-MM' : 'en-US';
  }

  function has(key) {
    return readValue(DICTIONARIES[getLanguage()], key) !== undefined || readValue(DICTIONARIES.en, key) !== undefined;
  }

  function t(key, params) {
    var value = readValue(DICTIONARIES[getLanguage()], key);

    if (value === undefined) {
      value = readValue(DICTIONARIES.en, key);
    }

    if (value === undefined) {
      return key;
    }

    return interpolate(value, params);
  }

  function syncButtons(root) {
    var language = getLanguage();

    (root || document).querySelectorAll('[data-language-switcher] [data-lang]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-lang') === language);
    });
  }

  function apply(root) {
    var scope = root || document;
    var page;

    if (!scope || !scope.querySelectorAll) {
      return;
    }

    scope.querySelectorAll('[data-i18n]').forEach(function (element) {
      element.textContent = t(element.getAttribute('data-i18n'));
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (element) {
      element.setAttribute('placeholder', t(element.getAttribute('data-i18n-placeholder')));
    });

    scope.querySelectorAll('[data-i18n-title]').forEach(function (element) {
      element.setAttribute('title', t(element.getAttribute('data-i18n-title')));
    });

    document.documentElement.lang = getLanguage();
    page = document.body ? document.body.getAttribute('data-page') : '';

    if (page && has('page_title.' + page)) {
      document.title = t('page_title.' + page);
    }

    syncButtons(scope);
  }

  function setLanguage(language, options) {
    var nextLanguage = DICTIONARIES[language] ? language : 'en';

    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch (error) {
      return null;
    }

    apply(document);

    if (!options || !options.silent) {
      document.dispatchEvent(new CustomEvent('gym-language-change', {
        detail: { language: nextLanguage }
      }));
    }

    return nextLanguage;
  }

  function bindSwitchers() {
    document.querySelectorAll('[data-language-switcher] [data-lang]').forEach(function (button) {
      button.addEventListener('click', function () {
        setLanguage(button.getAttribute('data-lang'));
      });
    });
  }

  function init() {
    bindSwitchers();
    setLanguage(getLanguage(), { silent: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GYM_I18N = {
    apply: apply,
    getLanguage: getLanguage,
    getLocale: getLocale,
    has: has,
    setLanguage: setLanguage,
    t: t
  };
})();
