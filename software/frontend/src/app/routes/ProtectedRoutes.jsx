import { Navigate } from "react-router-dom";




export default function ProtectedRoutes({children ,roles}){
    const {user} = useAuth();
    //if the user is not login
    if(!user){
        return <Navigate to="/login"/>
    }

    //role checks
    if (roles && !roles.includes(user.roles)){
        return <Navigate to ="/"/>
    }

    return children

}