const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// home
router.get('', authController.home_get);

// signup
router.get('/signup', authController.signup_get);
router.post('/signup', authController.signup_post);

// login
router.get('/login', authController.login_get);
router.post('/login', authController.login_post);

// logout
router.get('/logout', authController.logout_get);

// add-blog
router.get('/add-portfolio', authController.add_portfolio_get);
router.post('/add-portfolio', authController.add_portfolio_post);

// blog
router.get('/portfolio/:email', authController.portfolio_get);

// each post
router.get('/post/:id', authController.post_get);

// edit post
router.get('/edit-portfolio/:id', authController.edit_get);
router.put('/edit-portfolio/:id', authController.edit_put);

// delete post
router.delete('/delete-portfolio/:id', authController.delete_portfolio);

module.exports = router;