import os

def get_kinetics_classes():
    # Path to kinetics classes file
    kinetics_classes_path = os.path.join('autovideo', 'recognition', 'kinetics_classes.txt')
    
    # Read class names
    with open(kinetics_classes_path, 'r') as f:
        classes = [line.strip() for line in f.readlines()]
    
    return classes

def show_prediction(prediction_id):
    classes = get_kinetics_classes()
    if 0 <= prediction_id < len(classes):
        print(f"Predicted class: {classes[prediction_id]}")
    else:
        print(f"Invalid prediction ID: {prediction_id}")

if __name__ == "__main__":
    # Example usage
    prediction_id = 0  # Replace with your prediction result
    show_prediction(prediction_id) 