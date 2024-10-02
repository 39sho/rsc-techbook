"use server";

const ActionFn = async (arg: string) => {
	await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
	console.log("ActionFn: ", arg);
};

const FormActionFn = async (arg: FormData) => {
	await new Promise((resolve, _reject) => setTimeout(resolve, 1000));
	console.log("ActionFn: ", arg);
};

export { ActionFn, FormActionFn };
