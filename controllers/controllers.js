const Transcations = require('../models/TransactionsModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Register = require('../models/Registermodel');


const validateFields = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value) return { error: `${key} is required` };
    }
    return null;
};

// Signup
const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    const validationError = validateFields({ name, email, password });
    if (validationError) {
        return res.status(400).json({ message: validationError.error });
    }

    try {
        const existingUser = await Register.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new Register({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        console.log("error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// Login
const userLogin = async (req, res) => {
    const { email, password } = req.body;

    const validationError = validateFields({ email, password });
    if (validationError) {
        return res.status(400).json({ message: validationError.error });
    }

    try {
        const userDetails = await Register.findOne({ email });
        if (!userDetails) {
            return res.status(404).json({ message: "Invalid email" });
        }

        const isPasswordValid = await bcrypt.compare(password, userDetails.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const jwtToken = jwt.sign(
            { userId: userDetails._id.toString(), email },
            process.env.JWT_SECRET || "JWT_SECRET",
            { expiresIn: '1h' }
        );

        return res.status(200).json({ message: "Login successful", jwtToken });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal server error: " + error.message });
    }
};

// Authentication middleware
const authentication = async (req, res, next) => {
    let jwtToken;
    const authHeader = req.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(' ')[1];
    }

    if (jwtToken === undefined) {
        return res.status(401).json({ message: "Invalid JWT Token" });
    }

    try {
        const payload = jwt.verify(jwtToken, process.env.JWT_SECRET || "JWT_SECRET");
        req.userId = payload.userId;
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: error.message });
    }
};

// Create a new Transaction associated with the authenticated user
const createTransaction = async (req, res) => {
    const { type, category, amount, date, description } = req.body;

    const validationError = validateFields({ type, category, amount, date,description });
    if (validationError) {
        return res.status(400).json({ message: validationError.error });
    }

    try {
        const transaction = new Transcations({
            type,
            category,
            amount,
            date,
            description,
            userId: req.userId
        });
        await transaction.save();
        return res.status(201).json({ message: "Transaction Created!!" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

// Get all Transactions for the authenticated user
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transcations.find({ userId: req.userId }); 

        if (!transactions.length) {
            return res.status(404).json({ message: "No Transactions found" });
        }

        return res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

// Get Transaction details by ID for the authenticated user
const getTransactionById = async (req, res) => {
    const transactionId = req.params.id;

    if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID Required" });
    }

    try {
        const transactionDetails = await Transcations.findOne({ _id: transactionId, userId: req.userId }); 

        if (!transactionDetails) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.status(200).json(transactionDetails);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

// Update Transaction for the authenticated user
const updateTransaction = async (req, res) => {
    const transactionId = req.params.id;
    const { type, category, amount, date, description } = req.body;

    if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID Required" });
    }

    try {
        const transactionDetails = await Transcations.findOneAndUpdate(
            { _id: transactionId, userId: req.userId },
            { type, category, amount, date, description }
        );

        if (!transactionDetails) {
            return res.status(404).json({ message: "Transaction not found or unauthorized" });
        }

        return res.status(200).json({ message: "Transaction Updated Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

// Delete Transaction for the authenticated user
const deleteTransaction = async (req, res) => {
    const transactionId = req.params.id;

    if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID Required" });
    }

    try {
        const transactionDetails = await Transcations.findOneAndDelete({ _id: transactionId, userId: req.userId });

        if (!transactionDetails) {
            return res.status(404).json({ message: "Transaction not found or unauthorized" });
        }

        return res.status(200).json({ message: "Transaction Deleted Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error: " + error.message });
    }
};

// Get transaction summary for the authenticated user
const summary = async (req, res) => {
    try {
        const transactions = await Transcations.find({ userId: req.userId }); 

        let income = 0;
        let expenses = 0;

        transactions.forEach(transaction => {
            if (transaction.type === "income") {
                income += parseInt(transaction.amount);
            } else {
                expenses += parseInt(transaction.amount);
            }
        });

        return res.status(200).json({
            Total_Income: income,
            Total_Expenses: expenses
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    userLogin,
    authentication,
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    summary
};
