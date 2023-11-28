import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Course } from '../database/course';

const BASE_URL = getConfig().api.baseUrl;

/**
 * CourseApiContextType provides an API for interacting with Courses.
 */
export type CourseApiContextType = {
    /**
     * getCourse returns the course with the provided type and id.
     * @param type The type of the course.
     * @param id The id of the course.
     * @param checkoutId The Stripe checkout session id of the purchase for anonymous users.
     * @returns An AxiosResponse containing the requested course.
     */
    getCourse: (
        type: string,
        id: string,
        checkoutId?: string
    ) => Promise<AxiosResponse<GetCourseResponse>>;

    /**
     * listCourses returns a list of all courses with the provided type.
     * @param type The type of the course.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all courses with the provided type.
     */
    listCourses: (type: string, startKey?: string) => Promise<Course[]>;

    /**
     * listAllCourses returns a list of all courses.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all courses.
     */
    listAllCourses: (startKey?: string) => Promise<Course[]>;

    /**
     * Fetches a Stripe Checkout Session URL that can be used to purchase the course.
     * @param type The type of the course.
     * @param id The id of the course.
     * @param purchaseOption The name of the purchase option to use.
     * @returns An AxiosResponse containing the Checkout URL.
     */
    purchaseCourse: (
        type: string,
        id: string,
        purchaseOption?: string
    ) => Promise<AxiosResponse<PurchaseCourseResponse>>;
};

/** A response to a getCourse request. */
export interface GetCourseResponse {
    /** The requested Course. */
    course: Course;

    /**
     * Whether the user is blocked from viewing this course due to missing purchases.
     * If true, the course's chapters attribute will be null.
     */
    isBlocked: boolean;
}

/**
 * getCourse returns the course with the provided type and id.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the course.
 * @param id The id of the course.
 * @param checkoutId The Stripe checkout session id of the purchase for anonymous users.
 * @returns An AxiosResponse containing the requested course.
 */
export function getCourse(
    idToken: string,
    type: string,
    id: string,
    checkoutId?: string
) {
    if (idToken) {
        return axios.get<GetCourseResponse>(`${BASE_URL}/courses/${type}/${id}`, {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });
    }

    return axios.get<GetCourseResponse>(
        `${BASE_URL}/public/courses/${type}/${id}?checkoutId=${checkoutId}`
    );
}

interface ListCoursesResponse {
    courses: Course[];
    lastEvaluatedKey: string;
}

/**
 * listCourses returns a list of all courses with the provided type.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the course.
 * @param startKey The optional start key to use when searching.
 * @returns A list of all courses with the provided type.
 */
export async function listCourses(idToken: string, type: string, startKey?: string) {
    const params = { startKey };
    const result: Course[] = [];

    do {
        const resp = await axios.get<ListCoursesResponse>(`${BASE_URL}/courses/${type}`, {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.courses);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * listAllCourses returns a list of all courses.
 * @param startKey The optional start key to use when searching.
 * @returns A list of all courses.
 */
export async function listAllCourses(startKey?: string) {
    const params = { startKey };
    const result: Course[] = [];

    do {
        const resp = await axios.get<ListCoursesResponse>(`${BASE_URL}/public/courses`, {
            params,
        });

        result.push(...resp.data.courses);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

export interface PurchaseCourseResponse {
    /** The Stripe Checkout Session URL. */
    url: string;
}

/**
 * Fetches a Stripe Checkout Session URL that can be used to purchase the provided course.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the course to purchase.
 * @param id The id of the course to purchase.
 * @param purchaseOption The name of the purchase option to use.
 * @returns An AxiosResponse containing the Checkout URL.
 */
export function purchaseCourse(
    idToken: string,
    type: string,
    id: string,
    purchaseOption?: string
) {
    let url = idToken
        ? `${BASE_URL}/courses/${type}/${id}/purchase`
        : `${BASE_URL}/public/courses/${type}/${id}/purchase`;

    if (purchaseOption) {
        url += `?purchaseOption=${purchaseOption}`;
    }

    let headers = idToken
        ? {
              Authorization: 'Bearer ' + idToken,
          }
        : undefined;

    return axios.get<PurchaseCourseResponse>(url, {
        headers,
    });
}
