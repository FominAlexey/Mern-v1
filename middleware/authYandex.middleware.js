const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");

module.exports = (req, res, next) => {
    try {

        if (!req.body.yandexCode) {
            return res.status(401).json({ message: 'Нет кода аунтитефикации пользователя' })
        }   

        const clientId = config.get('yandexClientId');
        const yandexSecret = config.get('jwtYandexSecret');

        if (!clientId || !yandexSecret) {
            return res.status(401).json({ message: 'Ошибка аунтетификации приложения на Yandex!' })
        }        

        next()

    } catch (e) {
        res.status(401).json({ message: 'Нет авторизации' })
    }
}