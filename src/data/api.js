import axios from 'axios';

const apiUrl = '/api/';

export const singleFileUpload = async (data, options) => {
  try {
    const response = await axios.post(apiUrl + 'singleFile', data, options);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSingleFiles = async () => {
  try {
    const { data } = await axios.get(apiUrl + 'getSingleFiles');
    return data;
  } catch (error) {
    throw error;
  }
};

export const multipleFilesUpload = async (data, options) => {
  try {
    const response = await axios.post(apiUrl + 'multipleFiles', data, options);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMultipleFiles = async () => {
  try {
    const { data } = await axios.get(apiUrl + 'getMultipleFiles');
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteSingleFile = async (id) => {
  try {
    const { data } = await axios.delete(apiUrl + id);
    return data;
  } catch (error) {
    throw error;
  }
};
