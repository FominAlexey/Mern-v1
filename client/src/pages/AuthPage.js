import React, { useContext, useEffect, useState } from 'react';
import { useHttp } from '../hooks/http.hook';
import { useMessage } from './../hooks/message.hook';
import { AuthContext } from './../context/AuthContext';
import { useLocation } from "react-router-dom";

export const AuthPage = () => {
    const search = useLocation().search;
    const code = new URLSearchParams(search).get('code');
    const auth = useContext(AuthContext)
    const message = useMessage();
    const { loading, request, error, clearError } = useHttp()
    const [form, setFrom] = useState({
        email: '',
        password: ''
    })
    const [yandexCode, setYandexCode] = useState(null);

    useEffect(() => {
        message(error);
        clearError();
    }, [error, message, clearError])

    useEffect(() => {
        window.M.updateTextFields()
    }, [])

    const changeHandler = event => {
        setFrom({ ...form, [event.target.name]: event.target.value })
    }

    useEffect(() => {
        setYandexCode(code)
        if (yandexCode) {
            _loginYandexAuthorization(); 
        }
    }, [yandexCode, code])

    const registerHandler = async () => {
        try {
            const data = await request('/api/auth/register', 'POST', { ...form })
            message(data.message)
            console.log('Data', data)
        } catch (e) {
            
        }
    }

    const loginHandler = async () => {
        try {
            const data = await request('/api/auth/login', 'POST', { ...form })
            auth.login(data.token, data.userId)
            message(`Вы вошли под userId: ${data.userId}`)
            console.log('Data', data)
        } catch (e) {

        }
    }

    const loginYandexHandler = async () => { 
        try {
            const yandexCode = await request('/api/auth/loginYandex', 'GET', null) 
            if (yandexCode) {
                window.location.assign(`${yandexCode.url}`);
            }
           
        } catch (e) {
        }
    }

    const _loginYandexAuthorization = async () => {
        try {
            const yandexToken = await request('/api/auth/yandexToken', 'POST', { yandexCode });
            if (yandexToken.access_token) {
                const yandexInfoUser = await request('/api/auth/yandexInfoUser', 'GET', null, { 'Authorization': `YandexOAuth ${yandexToken.access_token}` });
                if (yandexToken.access_token) {
                    form.email = yandexInfoUser.default_email;
                    form.password = '123456';
                    const data = await request('/api/auth/login', 'POST', { ...form })
                    auth.login(data.token, data.userId)
                    message(`Вы вошли под userId: ${data.userId}`)
                    console.log('Data', data)
                }
            }
        } catch (e) {
        }
    }

    return (
        <div className='row'>
            <div className='col s6 offset-s3'>
                <h1>Сократи Ссылку</h1>
                <div className="card blue darken-1">
                    <div className="card-content white-text">
                        <span className="card-title">Авторизация</span>
                        <div>

                            <div className="input-field">
                                <input
                                    placeholder="Введите email"
                                    id="email"
                                    type="text"
                                    name="email"
                                    className='yellow-input'
                                    value={form.email}
                                    onChange={changeHandler}
                                />
                                <label htmlFor="email">Email</label>
                            </div>

                            <div className="input-field">
                                <input
                                    placeholder="Введите Пароль"
                                    id="password"
                                    type="password"
                                    name="password"
                                    className='yellow-input'
                                    value={form.password}
                                    onChange={changeHandler}
                                />
                                <label htmlFor="email">Пароль</label>
                            </div>
                        </div>
                    </div>
                    <div className="card-action">
                        <button
                            className='btn yellow darken-4'
                            style={{ marginRight: 10 }}
                            
                            disabled={loading}
                            onClick={loginHandler}
                        >
                            Войти
                        </button>
                        <button
                            className='btn grey lighten-1 black-text'
                            style={{ marginRight: 10 }}
                            onClick={registerHandler}
                            disabled={loading}
                        >
                            Регистрация
                        </button>
                        <button
                            className='btn red darken-4'
                            disabled={loading}
                            onClick={loginYandexHandler}
                        >
                            Яндекс
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}