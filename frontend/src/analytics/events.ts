import ReactGA from 'react-ga4';

import { User } from '../database/user';

export enum EventType {
    // Auth events
    Login = 'login',
    Logout = 'logout',
    Signup = 'signup',
    SignupConfirm = 'signup_confirm',
    ForgotPassword = 'forgot_password',
    ForgotPasswordConfirm = 'forgot_password_confirm',

    // Profile actions
    CreateProfile = 'create_profile',
    EditProfile = 'edit_profile',
    Graduate = 'graduate',
    UpdateProgress = 'update_progress',
    UpdateTimeline = 'update_timeline',
    CreateNondojoTask = 'create_nondojo_task',
    ViewTaskDetails = 'view_task_details',

    // Game actions
    SubmitGame = 'submit_game',
    UpdateGame = 'update_game',
    DeleteGame = 'delete_game',
    SearchGames = 'search_games',

    // Calendar actions
    SetAvailability = 'set_availability',
    BookAvailability = 'book_availability',
    CancelMeeting = 'cancel_meeting',

    // Material actions
    CreateSparringLink = 'create_sparring_link',
    CopyFen = 'copy_fen',
}

export function trackEvent(type: EventType, params?: any) {
    ReactGA.event(type, params);
}

export function setUser(user: User) {
    ReactGA.set({ userId: user.username });
    setUserCohort(user.dojoCohort);
}

export function setUserCohort(cohort: string | undefined) {
    if (cohort) {
        ReactGA.gtag('set', 'user_properties', {
            dojo_cohort: cohort,
        });
    }
}