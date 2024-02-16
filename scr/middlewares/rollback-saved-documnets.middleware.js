
export const rollbackSavedDocuments = async (req, res, next) => {
    if (req.savedDocument) {
        console.log('rollback saved document', req.savedDocument);
        const { model, _id } = req.savedDocument
        await model.findByIdAndDelete(_id)
    }
}

