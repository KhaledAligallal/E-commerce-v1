// Function to rollback saved documents in case of an error
export const rollbackSavedDocuments = async (req, res, next) => {
    // Checking if there's a saved document in the request object
    if (req.savedDocument) {
        // Logging the rollback action
        console.log('rollback saved document', req.savedDocument);

        // Extracting the model and _id from the saved document
        const { model, _id } = req.savedDocument;

        // Attempting to find and delete the document by its _id using the model
        await model.findByIdAndDelete(_id);
    }
};
