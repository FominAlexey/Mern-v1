const { Router, response } = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const request = require('request')
const User = require('../models/User')
const authYandex = require('../middleware/authYandex.middleware')
const router = Router()

// /api/auth/register
router.post(
    '/register',
    [
        check('email', 'Некорректный email').isEmail(),
        check('password', 'Минимальная длина пароля 6 символов')
            .isLength({min: 6})
    ],
    async (req, res) => {
        try {
        
            const errors = validationResult(req)
            
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при регистрации'
                })
            }
            
            const { email, password } = req.body
            
            const candidate = await User.findOne({ email: email })

            if (candidate) {
            return res.status(400).json({ message: 'Такой пользователь уже существует'})
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({ email, password: hashedPassword });
            
            await user.save()

            res.status(201).json({ message: 'Пользователь создан' })
    
        } catch (e) { 
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// /api/auth/login
router.post(
    '/login',
    [
        check('email', 'Введите корректный email').normalizeEmail().isEmail(),
        check('password', 'Введите пароль').exists()
    ],
    async (req, res) => {
        try {

            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при входе в систему'
                })
            }

            const { email, password } = req.body 
            
            const user = await User.findOne({ email })

            if (!user) {
                return res.status(400).json({ message: 'Пользователь не найден' })
            }

            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({ message: 'Неверный пароль, попробуйте снова' })
            }

            const token = jwt.sign(
                { userId: user.id },
                config.get('jwtSecret'),
                { expiresIn: '1h' }
            )

            res.json({ token, userId: user.id })

        } catch (e) {
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
        }       

    }
)

// /api/auth/loginYandex
router.get(
    '/loginYandex',
    async (req, res) => {
        try {
            
            res.json({
                url: `https://oauth.yandex.ru/authorize?response_type=code&client_id=${config.get('yandexClientId')}` });

        } catch (e) {
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
        }
    }
)


// /api/auth/yandexToken
router.post(
    '/yandexToken',
    authYandex,
    async (req, res) => {
        try { 

            request.post(
                {
                    url: 'https://oauth.yandex.ru/token',
                    form: {
                        grant_type: 'authorization_code',
                        code: req.body.yandexCode,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': "Basic " + Buffer.from(config.get('yandexClientId') + ':' + config.get('jwtYandexSecret')).toString('base64')
                    }
                },
                (err, response, body) => {
                    if (err) return res.status(500).send({ message: err })

                    
                    return res.send(body)
                }
            )      

        } catch (e) {
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
        }
    }
)

// /api/auth/yandexInfoUser
router.get(
    '/yandexInfoUser',
    async (req, res) => {
        try {
            
            request.get(
                {
                    url: 'https://login.yandex.ru/info?format=json',
                    headers: {
                        'Authorization': `OAuth ${req.headers['authorization']}`
                    }
                },
                async (err, response, body) => {
                    if (err) return res.status(500).send({ message: err })

                    const email = JSON.parse(body).default_email;
                    const candidate = await User.findOne({ email: email })

                    if (candidate) {
                        console.log('Такой пользователь уже существует')
                        return res.send(body)
                    }

                    const hashedPassword = await bcrypt.hash('123456', 12);
                    const user = new User({ email: email, password: hashedPassword });

                    await user.save()

                    console.log('Пользователь создан')

                    return res.send(body)
                }
            )

        } catch (e) {
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
        }
    }
)

module.exports = router