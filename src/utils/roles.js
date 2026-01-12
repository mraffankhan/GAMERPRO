export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user',
};

export const checkRole = (user, allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
};

export const isSuperAdmin = (user) => {
    return checkRole(user, [ROLES.SUPER_ADMIN]);
};

export const isAdmin = (user) => {
    return checkRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
};
