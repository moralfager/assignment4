// require('dotenv').config();
const User = require('../models/User');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// create token
const maxAge = 3 * 24 * 60 * 60;
function createToken(id) {
    return jwt.sign({ id }, process.env.SECRET, {
        expiresIn: maxAge
    });
}

// handle errors
function handelErrors(err) {
    console.log('Message:', err.message, '\nError Code:', err.code,'\n');
    let errors = { nickName:'', email: '', password: ''};

    // validation errors
    if (err.message.includes('user validation failed')) {
        // console.log(err, '\n');
        // To see details => console.log(Object.values(err.errors))
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    // login error
    if (err.message === 'Incorrect email') {
        errors.email = 'The email is invalid.';
    } 
    if (err.message === 'Incorrect password') {
        errors.password = 'The password is invalid.';
    }

    // duplicate error code
    if (err.code == 11000) {
        errors.email = 'The email is already registered';
        return errors;
    }
    return errors;
};

// get - home
module.exports.home_get = async (req, res) => {
    const locals = {
        title: 'Home'
    };
    try {
        const data = await Post.aggregate([{ $sort: { updatedAt: -1 } }]);
        res.render('home', { locals, data })
    } catch (error) {

    }
};

// get - signup
module.exports.signup_get = (req, res) => {
    const locals = {
        title: 'Sign Up'
    };
    res.render('signup', { locals });
};

// get - login
module.exports.login_get = (req, res) => {
    const locals = { 
        title: 'Log In'
    }
    res.render('login', { locals });
};

// get - logout
module.exports.logout_get = (req,res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
};

const sendWelcomeEmail = async (email, nickName) => {
    // Create a transporter
    let transporter = nodemailer.createTransport({
        service: 'gmail', // Use your preferred service
        auth: {
            user: process.env.EMAIL_USERNAME, // Your email id
            pass: process.env.EMAIL_PASSWORD, // Your password
        },
    });

    // Email options
    let mailOptions = {
        from: '"Portfolio app" <yourapp@example.com>', // sender address
        to: email, // list of receivers
        subject: 'Welcome to Our App!', // Subject line
        text: `Hello ${nickName}, welcome to our app! We're excited to have you on board.`, // plain text body
        html: `<b>Hello ${nickName},</b><br>Welcome to our app! We're excited to have you on board.`, // html body
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
};


// post - signup
module.exports.signup_post = async (req, res) => {
    const  { nickName, email, password } = req.body; 
    try {
        const user = await User.create({ nickName, email, password });
        const token = createToken(user._id);
        await sendWelcomeEmail(email, nickName);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000, sameSite: 'lax'});
        res.status(201).json({ user: user._id });
    } catch (error) {
        let errors = handelErrors(error);
        res.status(400).send({ errors });
    }
};

// post - login
module.exports.login_post = async (req, res) => {
    const  { email, password } = req.body; 
    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000, sameSite: 'lax'});
        res.status(201).json({ user: user._id });
    } catch (error) {
        let errors = handelErrors(error);
        res.status(400).send({ errors });
    }
};

// get - blog
module.exports.portfolio_get = async (req, res) => {
    try {
        const email = req.params.email;
        const token = req.cookies.jwt;
        let admin = false;
        if (token) {
            const decodedToken = jwt.verify(token, process.env.SECRET);
            let { email: tokenEmail} = await User.findById(decodedToken.id);
            if (tokenEmail === email) admin = true;
        }
        const data = await Post.find({ email });
        data.reverse();
        const { nickName } = await User.findOne({ email });
        const locals = {
            title: `${nickName}'s portfolio`
        }
        res.render('portfolio', { locals, data, admin });
    } catch (error) {
        console.log(error);
    }
}

// get - add blog
module.exports.add_portfolio_get = (req, res) => {
    const locals = {
        title: 'Add New Portfolio'
    };
    res.render('add-portfolio', { locals });
};

// post - add blog
module.exports.add_portfolio_post = async (req, res) => {
    try {
    const { title, body } = req.body;
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.SECRET);
    let { nickName, email } = await User.findById(decodedToken.id);
    const post = await Post.create({ nickName, email, title, body });
    res.status(200).json(post)
    } catch (error) {
        console.log(error);
    }
};

// get - each post
module.exports.post_get = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        let admin = false;
        const id = req.params.id;
        const post = await Post.findById(id);
        const { nickName: host } = await User.findOne({ email: post.email});
        if (token) {
            const decodedToken = jwt.verify(token, process.env.SECRET);
            let { email: tokenEmail} = await User.findById(decodedToken.id);
            if (tokenEmail === post.email) admin = true;
        }
        const locals = {
            title: post.title
        };
        res.render('post', { locals, post, host, admin });
    } catch (error) {
        console.log(error);
    }
};

// get - edit post
module.exports.edit_get = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (!token) res.redirect('/');
        const id = req.params.id;
        const data = await Post.findById(id);
        const decodedToken = jwt.verify(token, process.env.SECRET);
        let tokenUser = await User.findById(decodedToken.id);
        if (data.email == tokenUser.email ) {
            const locals = { title: 'Edit Post'};
            res.render('edit-portfolio', { locals, data });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error);
    }
};

// put - edit post
module.exports.edit_put = async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) res.redirect('/');
    const id = req.params.id;
    const data = await Post.findById(id);
    const decodedToken = jwt.verify(token, process.env.SECRET);
    let tokenUser = await User.findById(decodedToken.id);
    if (data.email == tokenUser.email ) {
        try {
            await data.updateOne({
                title: req.body.title,
                body: req.body.body,
                updatedAt: Date.now()
            });
            res.status(200).json({ message: 'update succeed' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'update failed' })
        }
    } else {
        res.redirect('/');
    }
};

// delete - delete post
module.exports.delete_portfolio = async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) res.redirect('/');
    const id = req.params.id;
    const data = await Post.findById(id);
    const decodedToken = jwt.verify(token, process.env.SECRET);
    let tokenUser = await User.findById(decodedToken.id);
    if (data.email == tokenUser.email ) {
        try {
            await data.deleteOne();
            res.redirect(`/portfolio/${tokenUser.email}`);
        } catch (error) {
            console.log(error);
            await data.deleteOne();
            res.redirect(`/portfolio/${tokenUser.email}`);
        }
    } else {
        res.redirect('/');
    }
};