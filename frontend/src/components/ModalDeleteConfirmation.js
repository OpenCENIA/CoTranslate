import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import axios from "axios";

const ModalDeleteConfirmation = (props) => {
	const {setModalDelete, modalDelete, deleteItem, refreshList, content} = props

	const handleDelete = () => {
    setModalDelete(!modalDelete);

    axios
      .delete(`/api/campaigns/${deleteItem.id}/`)
      .then((res) => refreshList());
	};

	const handleClose = () => {
    setModalDelete(false);
	}

	return (
		<Modal show={modalDelete} onHide={handleClose}>
			<Modal.Header closeButton>
				<Modal.Title>{content.modalTitle}</Modal.Title>
			</Modal.Header>
			<Modal.Body>{content.body1 + " " + deleteItem.title +" " + content.body2}</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose}>
					{content.cancelButton}
				</Button>
				<Button variant="danger" onClick={handleDelete}>
					{content.submitButton}
				</Button>
			</Modal.Footer>
		</Modal>
	);
};

export default ModalDeleteConfirmation;
