const router = require('express').Router();

const {
    createUser,
    userLogin,
    authentication, // Authentication middleware
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    summary
} = require('../controllers/controllers');

router.post('/signup', createUser);

router.post('/login', userLogin);

router.post('/transactions', authentication, createTransaction);

router.get('/transactions', authentication, getAllTransactions);

router.get('/transactions/:id', authentication, getTransactionById);

router.put('/transactions/:id', authentication, updateTransaction);

router.delete('/transactions/:id', authentication, deleteTransaction);

router.get('/summary', authentication, summary);

module.exports = router;
