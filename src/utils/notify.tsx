import { toast } from 'react-toastify';
import { handleError } from './errorsHandle';

const text = (msg: unknown): string => (typeof msg === 'string' ? msg : handleError(msg));

export const showSucces = (msg: unknown) =>{
    return toast.success(text(msg));
}

export const showError = (msg: unknown) =>{
    return toast.error(text(msg));
}

export const showInfo = (msg: unknown) =>{
    return toast.info(text(msg));
}

export const showWarning = (msg: unknown) =>{
    return toast.warning(text(msg));
};