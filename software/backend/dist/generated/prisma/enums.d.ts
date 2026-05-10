export declare const Role: {
    readonly USER: "USER";
    readonly ADMIN: "ADMIN";
    readonly OWNER: "OWNER";
};
export type Role = (typeof Role)[keyof typeof Role];
