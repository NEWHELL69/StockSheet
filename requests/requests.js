const mongoose = require('mongoose');

const documentResponseObj = (id, code, message, document) => {
  if (document) {
    // JSON.stringify calls the toJSON method defined on the document and does some other imp stuff.
    document = JSON.stringify(document);
    document = JSON.parse(document);

    return {
      id,
      state: {
        code,
        message,
      },
      document: {
        ...document,
      },
    };
  }
  return {
    id,
    state: {
      code,
      message,
    },
    document: null,
  };
};

exports.postSingle = (app, modelName, Model) => {
  app.post(`/api/${modelName}`, (request, response) => {
    const { body } = request;

    const document = new Model({ ...body });

    document.save()
      .then((savedDocument) => {
        // Unlike findById method which can resolve with null value,
        // save method only resolves with the saved document,
        // when the document is actually saved in database

        if (savedDocument === document) {
          response.json(documentResponseObj(savedDocument.id, 1, `${modelName} is saved in database`, savedDocument));
        } else {
          response.json(documentResponseObj(null, 2, `${modelName} was not saved in database`, null));
        }
      })
      .catch((error) => {
        console.log(error);
        response.status(400).json(documentResponseObj(null, 0, error.message, null));
      });
  });
};

exports.getSingle = (app, modelName, Model) => {
  app.get(`/api/${modelName}/:id`, (request, response) => {
    const { id } = request.params;

    // In context of get request and model reel, the state codes have following meaning:
    // 1 -> Reel was found (intended behaviour)
    // 2 -> Reel was not found in database (inteded behaviour)
    // 0 -> server error

    Model.findById(id)
      .then((document) => {
        if (document) {
          response.json(documentResponseObj(id, 1, `${modelName} was found`, document));
        } else {
          response.status(404).send(documentResponseObj(id, 2, `${modelName} was not found in database`, null));
        }
      }).catch((e) => {
        console.log(e);

        response.status(400).send(documentResponseObj(id, 0, e.message, null));
      });
  });
};

exports.getMultiple = (app, modelName, Model, ...middlewares) => {
  app.get(`/api/${modelName}s`, middlewares, (request, response) => {
    const { ids } = request.query;
    const idArray = ids.split(',');

    // In context of get request and reel model, the state codes have following meaning:
    // 1 -> Reel was found (intended behaviour)
    // 2 -> Reel was not found in database (inteded behaviour)
    // 0 -> server error

    const acknowledgments = idArray.map((id) => new Promise((resolve, reject) => {
      Model.findById(id).then((document) => {
        document
          ? resolve(documentResponseObj(id, 1, `${modelName} was found`, document))
          : resolve(documentResponseObj(id, 2, `${modelName} was not found`, null));
      }).catch((error) => {
        resolve(documentResponseObj(id, 0, error.message, null));
      });
    }));

    Promise.all(acknowledgments).then((res) => {
      response.json(res);
    });
  });
};

exports.deleteSingle = (app, modelName, Model) => {
  app.delete(`/api/${modelName}/:id`, (request, response) => {
    // This conversion here is necessary
    const id = new mongoose.Types.ObjectId(request.params.id);

    Model.deleteOne(id).then((res) => {
      if (res.deletedCount === 1) {
        response.json(documentResponseObj(id, 1, `${modelName} was deleted from database`, null));
      } else if (res.deletedCount === 0) {
        response.json(documentResponseObj(id, 2, `${modelName} was not found and hence not deleted`, null));
      }
    }).catch((e) => {
      response.json(documentResponseObj(id, 0, e.message, null));
    });
  });
};

exports.deleteMultiple = (app, modelName, Model, ...middlewares) => {
  app.delete(`/api/${modelName}s`, middlewares, (request, response) => {
    const { ids } = request.query;
    const idArray = ids.split(',');

    // In context of delete request for reel, the state codes have following meaning:
    // 1 -> Reel deletion successfull (intended behaviour)
    // 2 -> Reel was not found in database (inteded behaviour)
    // 0 -> server error

    const acknowledgments = idArray.map(async (id) => {
      try {
        // This conversion here is necessary
        const objId = new mongoose.Types.ObjectId(id);

        const deleted = await Model.deleteOne(objId);

        return deleted.deletedCount === 1
          ? documentResponseObj(id, 1, `${modelName} was deleted`, null)
          : documentResponseObj(id, 2, `${modelName} was not found and hence not deleted`, null);
      } catch (error) {
        return documentResponseObj(id, 0, error.message, null);
      }
    });

    Promise.all(acknowledgments).then((res) => {
      response.json(res);
    });
  });
};

exports.postMultiple = (app, modelName, Model) => {
  app.post(`/api/${modelName}s`, async (request, response, next) => {
    const documentsToSave = request.body;

    // In context of post request for reel, the state codes have following meaning:
    // 1 -> Reel was saved (intended behaviour)
    // 2 -> Reel was not saved (inteded behaviour)
    // 0 -> server error

    const acknowledgments = documentsToSave.map(async (documentToSave) => {
      try {
        documentToSave = new Model({ ...documentToSave });
        const savedDocument = await documentToSave.save();

        return documentToSave === savedDocument
          ? documentResponseObj(savedDocument.id, 1, `${modelName} was saved`, savedDocument)
          : documentResponseObj(null, 2, `${modelName} was not saved in database`, null);
      } catch (error) {
        return documentResponseObj(null, 0, error.message, null);
      }
    });
    response.json(await Promise.all(acknowledgments));
  });
};

exports.putSingle = (app, modelName, Model) => {
  app.put(`/api/${modelName}/:id`, (request, response) => {
    const { body } = request;
    const { id } = request.params;

    const updationToDocument = { ...body };

    Model.findByIdAndUpdate(id, updationToDocument, { new: true }).then((updatedDocument) => {
      if (updatedDocument) {
        response.json(documentResponseObj(updatedDocument.id, 1, `${modelName} was found and updated`, updatedDocument));
      }
      response.json(documentResponseObj(null, 2, `${modelName} was not found and hence not updated`, null));
    }).catch((e) => {
      response.status(400).send(documentResponseObj(id, 0, e.message, null));
    });
  });
};
