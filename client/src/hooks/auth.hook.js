import {useState, useCallback, useEffect} from 'react'

const storageName = 'userData';

export const useAuth = () => {
    const [token, setToken] = useState(null);
    const [ready, setReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [yandexToken, setYandexToken] = useState(null);

    const login = useCallback((jwtToken, id, yandexToken) => { 
        setToken(jwtToken)
        setUserId(id)
        setYandexToken(yandexToken)

        localStorage.setItem(storageName, JSON.stringify({
            userId: id, token: jwtToken
        }))
    }, [])
    
    const logout = useCallback(() => { 
        setToken(null)
        setUserId(null)
        setYandexToken(null)

        localStorage.removeItem(storageName)
    }, [])

    useEffect(() => { 
        const data = JSON.parse(localStorage.getItem(storageName))
        
        if (data && data.token) {
            login(data.token, data.userId)      
        }

        if (yandexToken) {
            login(null, null, yandexToken)
        }

        setReady(true)

    }, [login])

    return { login, logout, token, yandexToken, userId, ready}
}