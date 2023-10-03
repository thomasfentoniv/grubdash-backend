const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Middleware functions

function validateDeliveryProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({ status: 400, message: `A 'deliverTo' property is required.` });
}

function validateMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({ status: 400, message: `A 'mobileNumber' property is required.` });
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status) {
    res.locals.status = status;
    return next();
  }
  next({ status: 400, message: `A 'status' property is required.` });
}

function validateStatusString(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  if (validStatuses.includes(status)) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'`,
  });
}

function validateDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes) {
    res.locals.dishes = dishes;
    return next();
  }
  next({ status: 400, message: `A 'dishes' property is required.` });
}

function validateDishesArray(req, res, next) {
  const dishes = res.locals.dishes;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: `Invalid dishes property: dishes property must be a non-empty array`,
    });
  }
  next();
}

function validateDishesQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (const dish of dishes) {
    const { quantity } = dish;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${dish.id} must have a valid quantity.`,
      });
    }
  }
  next();
}

function checkOrderIdMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `ID ${id} must match orderId provided in parameters`,
    });
  }
  next();
}

function checkOrderExists(req, res, next) {
  const { orderId } = req.params;
  const matchingOrder = orders.find((order) => order.id === orderId);
  if (matchingOrder) {
    res.locals.order = matchingOrder;
    return next();
  }
  next({ status: 404, message: `Order ID not found: ${orderId}` });
}

// Route handlers

function listOrders(req, res) {
  res.json({ data: orders });
}

function updateOrder(req, res) {
  const { orderId } = req.params;
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  const order = orders.find((order) => order.id === orderId);
  Object.assign(order, { deliverTo, mobileNumber, status, dishes });
  res.json({ data: order });
}

function readOrder(req, res) {
  res.json({ data: res.locals.order });
}

function createOrder(req, res) {
  const { deliverTo, mobileNumber, dishes } = req.body.data;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "out-for-delivery",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function deleteOrder(req, res, next) {
  const { orderId } = req.params;
  const order = orders.find((order) => order.id === orderId);
  if (order.status === "pending") {
    const index = orders.findIndex((order) => order.id === Number(orderId));
    orders.splice(index, 1);
    return res.sendStatus(204);
  }
  next({
    status: 400,
    message: `Order cannot be deleted unless order status is 'pending'`,
  });
}

module.exports = {
  list: listOrders,
  read: [checkOrderExists, readOrder],
  create: [
    validateDeliveryProperty,
    validateMobileNumber,
    validateDishesProperty,
    validateDishesArray,
    validateDishesQuantity,
    createOrder,
  ],
  update: [
    checkOrderExists,
    checkOrderIdMatch,
    validateDeliveryProperty,
    validateMobileNumber,
    validateDishesProperty,
    validateStatus,
    validateStatusString,
    validateDishesArray,
    validateDishesQuantity,
    updateOrder,
  ],
  delete: [checkOrderExists, deleteOrder],
};
